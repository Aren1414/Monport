import { redirect } from 'next/navigation'

export default function SharePage() {
  redirect(
    'https://warpcast.com/~/compose?text=🚀%20Just%20minted%20a%20Welcome%20NFT%20on%20Monad!%0A%0AJoin%20the%20Mini%20App%20and%20mint%20yours%20now%20👇%0A%0ACreated%20by%20@overo.eth&embeds[]=https%3A%2F%2Fmonport-three.vercel.app'
  )
}
