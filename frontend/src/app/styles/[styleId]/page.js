import StyleDetailPage from './StyleDetailPage';

export const dynamic = 'force-dynamic';

export default function Page({ params }) {
  return <StyleDetailPage styleId={params.styleId} />;
}