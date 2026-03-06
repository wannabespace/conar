import type { ComponentProps } from 'react'
import { SOCIAL_LINKS } from '@conar/shared/constants'
import { Avatar, AvatarFallback, AvatarImage } from '@conar/ui/components/avatar'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { RiDoubleQuotesL, RiTwitterXLine } from '@remixicon/react'

interface TestimonialCardProps extends ComponentProps<'article'> {
  testimonialId: string
}

function TestimonialCard({ className, children, testimonialId, ...props }: TestimonialCardProps) {
  return (
    <article
      className={cn(`
        rounded-2xl border bg-card p-4 transition-all duration-300
        sm:p-6
      `, className)}
      data-testimonial={testimonialId}
      {...props}
    >
      {children}
    </article>
  )
}

interface TestimonialProps {
  name: string
  login: string
  avatar: string
  link: string
  children: React.ReactNode
  className?: string
}

function Testimonial({ name, login, avatar, link, children, className }: TestimonialProps) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        block space-y-4 transition-transform
        focus-visible:outline-ring/50
        sm:space-y-6
      `}
    >
      <header className={cn(`
        mb-4 flex items-center gap-3
        sm:mb-6 sm:gap-4
      `, className)}
      >
        <Avatar className={`
          size-10 shrink-0 rounded-full
          sm:size-12
        `}
        >
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
            {name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className={`
            truncate text-sm font-semibold text-foreground
            sm:text-base
          `}
          >
            {name}
          </h3>
          <p className={`
            text-xs text-muted-foreground
            sm:text-sm
          `}
          >
            @
            {login}
          </p>
        </div>
      </header>
      <div className="relative">
        <RiDoubleQuotesL
          className={`
            absolute -top-1 -left-1 size-5 text-primary/20
            sm:-top-2 sm:-left-2 sm:size-6
          `}
          aria-hidden="true"
        />
        <blockquote className={`
          pl-3 text-sm/relaxed text-foreground
          sm:pl-4 sm:text-base
        `}
        >
          {children}
        </blockquote>
      </div>
    </a>
  )
}

function JoinTestimonials() {
  return (
    <div className={`
      flex min-h-full items-center justify-center space-y-4
      sm:space-y-6
    `}
    >
      <div className="text-center">
        <div className={`
          mx-auto mb-3 flex size-10 items-center justify-center rounded-xl
          bg-linear-to-br from-primary/20 to-primary/10
          sm:mb-4 sm:size-12
        `}
        >
          <RiTwitterXLine
            className={`
              size-5 text-primary
              sm:size-6
            `}
            aria-hidden="true"
          />
        </div>
        <h3 className={`
          mb-2 text-sm font-semibold text-foreground
          sm:text-base
        `}
        >
          Want to be featured here?
        </h3>
        <Button asChild variant="link">
          <a
            href={SOCIAL_LINKS.TWITTER}
            target="_blank"
            rel="noopener noreferrer"
          >
            Tag @conar_app on
            <RiTwitterXLine
              className={`
                size-3
                sm:size-4
              `}
              aria-hidden="true"
            />
          </a>
        </Button>
      </div>
    </div>
  )
}

const testimonials: {
  name: string
  login: string
  avatar: string
  link: string
  children: () => React.ReactNode
}[] = [
  {
    name: 'Peter Steinberger',
    login: 'steipete',
    avatar: '/avatars/steipete.png',
    link: 'https://x.com/steipete/status/1961806791404130480',
    children: () => 'Postgres + AI is amazing. @conar_app',
  },
  {
    name: 'Maze',
    login: 'mazeincoding',
    avatar: '/avatars/mazeincoding.jpg',
    link: 'https://x.com/mazeincoding/status/1929612879600181555',
    children: () => 'finally, a database viewer that doesn\'t suck',
  },
  {
    name: 'Noah',
    login: 'itsnoahd',
    avatar: '/avatars/itsnoahd.jpg',
    link: 'https://x.com/itsnoahd/status/1936938123570925802',
    children: () => 'HOLY CRAP WHAT??? @conar_app where have you been? This is so much easier then pgadmin. IT ALSO has some really nice micro animations and interactions wow.',
  },
  {
    name: 'Ansh Rathod',
    login: 'anshrathodfr',
    avatar: '/avatars/anshrathodfr.jpg',
    link: 'https://x.com/anshrathodfr/status/1935670652289347720',
    children: () => 'omg tried it and love this app!',
  },
  {
    name: 'Tristan Rhodes',
    login: 'tristanbob',
    avatar: '/avatars/tristanbob.jpg',
    link: 'https://x.com/tristanbob/status/1935675893596434817',
    children: () => 'wow, I love this!',
  },
  {
    name: 'lasse',
    login: 'lassejlv',
    avatar: '/avatars/lassejlv.png',
    link: 'https://x.com/lassejlv/status/1940734263772828006',
    children: () => '@conar_app is the best database viewer i ever used, no cap 🔥',
  },
  {
    name: 'Dominik',
    login: 'DominikDoesDev',
    avatar: '/avatars/dominikdoesdev.jpg',
    link: 'https://x.com/DominikDoesDev/status/1942986868758372850',
    children: () => 'Not gonna lie I was looking for something like @conar_app a while ago but couldn\'t find it until now. I think I am in love with this 😍',
  },
  {
    name: 'Sorin Curescu',
    login: 'en3sis',
    avatar: '/avatars/en3sis.jpg',
    link: 'https://x.com/en3sis/status/1945158382396010955',
    children: () => 'If you’re reading this, go download @conar_app now and thank me later! ;)',
  },
  {
    name: 'Berke',
    login: 'chef_berke',
    avatar: '/avatars/chef_berke.jpg',
    link: 'https://x.com/chef_berke/status/1949880848246853733',
    children: () => 'found my new favorite db tool if you work with postgresql, definitely check this out @conar_app',
  },
  {
    name: 'Alex Holovach',
    login: 'alex_holovach',
    avatar: '/avatars/alex_holovach.jpg',
    link: 'https://x.com/alex_holovach/status/1950707905440727087',
    children: () => 'wow I can query data at the speed of thought with @conar_app',
  },
  {
    name: 'Iza',
    login: 'izadoesdev',
    avatar: '/avatars/izadoesdev.jpg',
    link: 'https://x.com/izadoesdev/status/1955604787585802722',
    children: () => 'okay why did nobody tell me how sexy @conar_app is',
  },
]

export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className={`
        py-8
        sm:py-12
        lg:py-16
      `}
    >
      <div className={`
        mb-12 px-4 text-center
        sm:mb-16
      `}
      >
        <h2
          id="testimonials-heading"
          className={`
            mb-3 text-center text-sm font-medium tracking-wide
            text-muted-foreground uppercase
          `}
        >
          Testimonials
        </h2>
        <p className={`
          mx-auto max-w-3xl text-center text-2xl/tight font-bold
          text-balance
          sm:text-3xl
        `}
        >
          Loved by developers worldwide
        </p>
      </div>
      <div className={`
        mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4
        sm:grid-cols-2 sm:gap-6
        lg:grid-cols-3
      `}
      >
        {testimonials.map(testimonial => (
          <TestimonialCard key={testimonial.login} testimonialId={testimonial.login}>
            <Testimonial
              name={testimonial.name}
              login={testimonial.login}
              avatar={testimonial.avatar}
              link={testimonial.link}
            >
              {testimonial.children()}
            </Testimonial>
          </TestimonialCard>
        ))}
        <TestimonialCard testimonialId="join-us">
          <JoinTestimonials />
        </TestimonialCard>
      </div>
    </section>
  )
}
