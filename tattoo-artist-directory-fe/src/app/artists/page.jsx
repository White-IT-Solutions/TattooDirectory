import ArtistCard from "../components/ArtistCard";
import {mockArtistData} from "../data/mockArtistData";

export default async function ArtistsListPage({ searchParams }) {
	const searchTerm = await searchParams?.q || "";
	console.log(mockArtistData)

  const filteredArtists =
    searchTerm.trim() === ""
      ? mockArtistData
      : mockArtistData.filter((artist) => {
          const term = searchTerm.toLowerCase();
          return (
            artist.artistsName.toLowerCase().includes(term) ||
            artist.styles.some((style) => style.toLowerCase().includes(term))
          );
        });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Artists Directory</h1>

        {/* Search Bar */}
        <form method="get" className="mb-8 flex justify-center">
          <input
            type="text"
            name="q"
            defaultValue={searchTerm}
            placeholder="Search by artist or style..."
            className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </form>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtists.length > 0 ? (
            filteredArtists.map((artist) => (
              <ArtistCard key={artist.PK} artist={artist} />
            ))
          ) : (
            <p className="text-center text-gray-600">
              {searchTerm.trim() !== ""
                ? "No artists match your search."
                : "No artists available."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
