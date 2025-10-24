import StyleDetailPage from './StyleDetailPage';

// Generate static params for all styles
export async function generateStaticParams() {
  // Import style data for static generation
  const { enhancedTattooStyles } = await import('../../../lib/data/tattooStyles');
  
  return Object.keys(enhancedTattooStyles).map((styleId) => ({
    styleId: styleId,
  }));
}

export default function Page({ params }) {
  return <StyleDetailPage styleId={params.styleId} />;
}