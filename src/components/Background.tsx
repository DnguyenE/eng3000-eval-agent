export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden" aria-hidden="true">
      <div className="blob -top-40 -left-32 h-[32rem] w-[32rem] bg-indigo-600" />
      <div className="blob top-1/3 -right-40 h-[28rem] w-[28rem] bg-sky-500 [animation-delay:-7s]" />
      <div className="blob -bottom-48 left-1/4 h-[30rem] w-[30rem] bg-emerald-500 [animation-delay:-14s]" />
      <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
    </div>
  )
}
