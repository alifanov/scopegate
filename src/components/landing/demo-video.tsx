export function DemoVideo() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">See it in action</h2>
          <p className="text-slate-400">Watch how ScopeGate gives your AI agents exactly the access they need — nothing more.</p>
        </div>
        <div className="relative rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-slate-950/80">
          <video
            src="/scopegate-demo.mp4"
            controls
            playsInline
            className="w-full block"
          />
        </div>
      </div>
    </section>
  );
}
