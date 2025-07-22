import ArtistProfile from '@/components/pages/ArtistProfile'

export default function ArtistProfilePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  return <ArtistProfile id={params.id} />
}