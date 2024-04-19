import { Link } from '@remix-run/react'
import {
  BrainCogIcon,
  PackageIcon,
  ThumbsUpIcon,
  TrophyIcon,
  UsersIcon,
  ZapIcon,
} from 'lucide-react'

import { buttonVariants } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import { cn } from '~/utils/cn'

export default function IndexPage() {
  return (
    <div className="flex flex-col gap-6 items-center justify-center">
      <div className="container flex flex-col items-center justify-center min-h-[500px]">
        <div className="flex items-center justify-center gap-6">
          <Icons.logo className="w-20" />
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            EvntBoard
          </h1>
        </div>
        <div className="mt-5 max-w-3xl">
          <p className="text-xl text-muted-foreground">
            Your next automation tool !
          </p>
        </div>
        <p className="text-lg text-muted-foreground">
          Join the community and automate everything you can imagine.
        </p>
        <div className="mt-8 gap-3 flex justify-center">
          <Link
            to="/login"
            className={cn(
              buttonVariants({  size: 'lg' }),
            )}
          >
            Get started
          </Link>

          <Link
            to="#start"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
            )}
          >
            Learn more
          </Link>
        </div>
      </div>
      <div className="max-w-4xl px-2" id="start">
        <div className="flex flex-col gap-6 lg:gap-12 ">
          <div className="flex">
            <BrainCogIcon className="flex-shrink-0 mt-2 h-8 w-8" />
            <div className="ms-5 sm:ms-8">
              <h3 className="text-base sm:text-lg font-semibold">
                Ease of Use
              </h3>
              <p className="mt-1 text-muted-foreground">
                The application offers an intuitive and user-friendly interface, ensuring that even beginners can
                effortlessly navigate and create complex automations to streamline their processes.
              </p>
            </div>
          </div>
          <div className="flex">
            <PackageIcon className="flex-shrink-0 mt-2 h-8 w-8" />
            <div className="ms-5 sm:ms-8">
              <h3 className="text-base sm:text-lg font-semibold">
                Limitless Customization
              </h3>
              <p className="mt-1 text-muted-foreground">
                With the tool, you have the power to tailor workflows precisely to your needs. Whether it&apos;s
                combining
                various events, conditions, or actions, the platform empowers you to craft automation sequences that
                perfectly align with your preferences and requirements.
              </p>
            </div>
          </div>
          <div className="flex">
            <ZapIcon className="flex-shrink-0 mt-2 h-8 w-8" />
            <div className="ms-5 sm:ms-8">
              <h3 className="text-base sm:text-lg font-semibold">
                Time and Effort Savings
              </h3>
              <p className="mt-1 text-muted-foreground">
                By automating repetitive tasks, the tool liberates valuable time that can be redirected towards more
                significant and creative pursuits. Say goodbye to tedious manual processes and embrace the efficiency of
                automated workflows.
              </p>
            </div>
          </div>
          <div className="flex">
            <TrophyIcon className="flex-shrink-0 mt-2 h-8 w-8" />
            <div className="ms-5 sm:ms-8">
              <h3 className="text-base sm:text-lg font-semibold">
                Endless Extensibility
              </h3>
              <p className="mt-1 text-muted-foreground">
                Thanks to its support for modules and JavaScript scripts, you can extend its functionality to adapt to
                evolving demands. Whether you&apos;re integrating new tools or customizing existing features, the
                application provides a scalable solution to meet your automation needs.
              </p>
            </div>
          </div>
          <div className="flex">
            <UsersIcon className="flex-shrink-0 mt-2 h-8 w-8" />
            <div className="ms-5 sm:ms-8">
              <h3 className="text-base sm:text-lg font-semibold">
                Simplified Collaboration
              </h3>
              <p className="mt-1 text-muted-foreground">
                Collaboration is made effortless with its seamless import/export and sharing capabilities. Connect
                with other users, exchange triggers, and collaborate on refining automation strategies. Together, you
                can harness the collective expertise of the community to optimize workflows and achieve greater
                efficiency.
              </p>
            </div>
          </div>
          <div className="flex">
            <ThumbsUpIcon className="flex-shrink-0 mt-2 h-8 w-8" />
            <div className="ms-5 sm:ms-8">
              <h3 className="text-base sm:text-lg font-semibold">
                Active and Engaged Community
              </h3>
              <p className="mt-1 text-muted-foreground">
                Join a vibrant community of developers and enthusiasts who actively contribute to its ongoing
                improvement. Benefit from shared insights, troubleshoot challenges, and explore innovative automation
                solutions together. With the support of this dynamic community, the possibilities are endless.
              </p>
            </div>
          </div>
        </div>
      </div>
      <footer
        className="w-full justify-end md:flex md:items-center md:justify-between py-4 md:py-8 border-t px-4"
      >
        <ul className="flex mb-4 md:order-1 md:ml-4 md:mb-0">
          <li>
            <Link
              rel="noreferrer"
              to="https://twitch.tv/evntboard"
              target="_blank"
              aria-label="Twitch"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
              )}
            >
              <Icons.twitch className="w-6 h-6" />
            </Link>
          </li>
          <li className="ml-4">
            <Link
              rel="noreferrer"
              to="https://github.com/evntboard"
              target="_blank"
              aria-label="Github"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
              )}
            >
              <Icons.github className="w-6 h-6" />
            </Link>
          </li>
          <li className="ml-4">
            <Link
              rel="noreferrer"
              to="https://twitter.com/evntboard"
              target="_blank"
              aria-label="Twitter"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
              )}
            >
              <Icons.twitter className="w-6 h-6" />
            </Link>
          </li>
          <li className="ml-4">
            <Link
              rel="noreferrer"
              to="https://discord.gg/t5paG53gYA"
              target="_blank"
              aria-label="Discord"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
              )}
            >
              <Icons.discord className="w-6 h-6" />
            </Link>
          </li>
        </ul>
        <div className="text-sm text-muted-foreground mr-4">{new Date().getFullYear()} &copy; EvntBoard. All rights
          reserved.
        </div>
      </footer>
    </div>
  )
}