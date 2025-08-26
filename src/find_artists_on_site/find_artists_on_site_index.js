exports.handler = async (event) => {
    console.log('Find Artists on Site Event:', JSON.stringify(event, null, 2));
    // Placeholder for finding artists on a given studio website.
    // Input: a single studio object.
    // Output: an array of artist objects found at that studio.
    const artists = [
      { "artistId": `${event.studioId}-artist-1`, "portfolioUrl": `https://instagram.com/artist1` },
      { "artistId": `${event.studioId}-artist-2`, "portfolioUrl": `https://instagram.com/artist2` }
    ];
    return { artists: artists };
};