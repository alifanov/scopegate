import { beforeEach, describe, expect, it, vi } from "vitest";
import { PROJECT_ROLE } from "@/lib/project-roles";
import { TeamMembershipError, removeProjectMember } from "../team-membership";

const database = {
  teamMember: { findUnique: vi.fn(), count: vi.fn(), delete: vi.fn() },
};

const audit = vi.fn();

describe("removeProjectMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 404 when the member does not exist", async () => {
    database.teamMember.findUnique.mockResolvedValue(null);

    await expect(
      removeProjectMember("project-1", "user-1", { database, audit })
    ).rejects.toMatchObject({ message: "Member not found", status: 404 });

    expect(database.teamMember.delete).not.toHaveBeenCalled();
  });

  it("rejects removing the last owner", async () => {
    database.teamMember.findUnique.mockResolvedValue({ role: PROJECT_ROLE.owner });
    database.teamMember.count.mockResolvedValue(1);

    await expect(
      removeProjectMember("project-1", "user-1", { database, audit })
    ).rejects.toMatchObject({
      message: "Cannot remove the last owner",
      status: 400,
    });
    await expect(
      removeProjectMember("project-1", "user-1", { database, audit })
    ).rejects.toBeInstanceOf(TeamMembershipError);

    expect(database.teamMember.delete).not.toHaveBeenCalled();
  });

  it("removes an owner when other owners remain", async () => {
    database.teamMember.findUnique.mockResolvedValue({ role: PROJECT_ROLE.owner });
    database.teamMember.count.mockResolvedValue(2);
    database.teamMember.delete.mockResolvedValue({});

    await removeProjectMember("project-1", "user-1", { database, audit });

    expect(database.teamMember.delete).toHaveBeenCalledWith({
      where: { userId_projectId: { userId: "user-1", projectId: "project-1" } },
    });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "member:remove", status: "success" })
    );
  });

  it("removes a plain member without checking owner count", async () => {
    database.teamMember.findUnique.mockResolvedValue({ role: PROJECT_ROLE.member });
    database.teamMember.delete.mockResolvedValue({});

    await removeProjectMember("project-1", "user-1", { database, audit });

    expect(database.teamMember.count).not.toHaveBeenCalled();
    expect(database.teamMember.delete).toHaveBeenCalled();
  });
});
