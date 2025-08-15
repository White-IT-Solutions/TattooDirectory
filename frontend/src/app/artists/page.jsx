import ArtistCard from "../components/ArtistCard";
import { api } from "../../lib/api";

export default async function ArtistsListPage({ searchParams }) {
  let artists = [];
  let filteredArtists = [];

  const params = await searchParams;
  const searchTerm = params?.q || "";
  const styles = params?.styles || "";

  try {
    if (styles) {
      const result = await api.getArtistsByStyles(styles);
      console.log(result);
      artists = result.items || [];
    } else {
      const result = await api.getArtists();
      artists = result.items || [];
    }

    // Filter by search term if provided
    filteredArtists =
      searchTerm.trim() === ""
        ? artists
        : artists.filter((artist) => {
            const term = searchTerm.toLowerCase();
            return (
              artist.artistsName?.toLowerCase().includes(term) ||
              artist.styles?.some((style) => style.toLowerCase().includes(term))
            );
          });
  } catch (error) {
    console.error("Failed to fetch artists:", error);
    filteredArtists = [];
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Artists Directory
        </h1>

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
        <div className="w-full mx-auto grid md:grid-cols-2 lg:grid-cols-5 gap-1 p-5">
          {filteredArtists.length > 0 ? (
            filteredArtists.map((artist) => (
              <ArtistCard key={artist.artistId || artist.PK} artist={artist} />
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
