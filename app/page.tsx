import Map from "./components/Map";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <h1 className="text-2xl font-bold p-4 border-b border-gray-800">
        Fleet Tracking Dashboard
      </h1>
      <div className="flex flex-1 overflow-hidden">
        <Map />
      </div>
    </div>
  );
}
