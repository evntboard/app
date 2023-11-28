import Link from 'next/link'
import {siteConfig} from "@/config/site";

export default function NotFound() {
    return (
        <div>
            <h2>Not Found</h2>
            <p>Could not find requested resource</p>
            <Link href={siteConfig.mainNav[0].href}>Return Home</Link>
        </div>
    )
}