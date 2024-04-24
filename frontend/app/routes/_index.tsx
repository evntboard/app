import { redirect } from '@remix-run/node';

export const loader = () => {
  return redirect('/organizations')
}

export default function IndexPage() {
  return null
}