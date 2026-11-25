import { PiBowlFood } from 'react-icons/pi'
import { EmptyState } from '../components/bits.jsx'
import { useTitle } from '../lib/ui.js'

export default function NotFound() {
  useTitle('Page not found')
  return (
    <div className="wrap py-10">
      <EmptyState icon={PiBowlFood} title="This plate is empty" action="Browse restaurants" to="/">
        The page you were looking for has moved or never existed. There is plenty to eat on the home page.
      </EmptyState>
    </div>
  )
}
