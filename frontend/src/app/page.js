import MapWithSearch from "./components/MapWithSearch.js";

export default function Home() {
  return (
    <div>
      <section className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h1 className="merienda text-5xl md:text-7xl font-bold text-center mb-4">
          Tattoo Directory
        </h1>
        <h2 className="merienda text-2xl md:text-3xl font-semibold text-center mb-8">
          find your artist
        </h2>
        <MapWithSearch />
      </section>
    </div>
  );
}
