import Map from "./components/Map";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <h1 className="text-2xl font-bold p-4">Fleet Tracking Dashboard</h1>
      <Map />
    </div>
  );
}
