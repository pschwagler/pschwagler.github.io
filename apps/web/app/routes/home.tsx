import { Link } from "react-router";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Patrick</h1>
        <p className="text-lg text-neutral-600">
          Software engineer building thoughtful products.
        </p>
      </div>
      <div>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Ask me anything
        </Link>
      </div>
    </div>
  );
}
