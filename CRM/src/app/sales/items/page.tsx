function Placeholder({ title }: { title: string }) {
  return (
    <div className="card p-6">
      <h1 className="section-title text-[28px]">{title}</h1>
      <p className="mt-3 text-sm text-[#6f8092]">This section is scaffolded to match the RISE navigation.</p>
    </div>
  );
}

export default function Page() {
  return <Placeholder title="Items" />;
}
