import type { ComponentProps } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@conar/ui/components/avatar'
import { Button } from '@conar/ui/components/button'
import { cn } from '@conar/ui/lib/utils'
import { constants } from '@conar/web/src/utils/constants'
import { RiDoubleQuotesL, RiTwitterXLine } from '@remixicon/react'

interface TestimonialCardProps extends ComponentProps<'article'> {
  testimonialId: string
}

function TestimonialCard({ className, children, testimonialId, ...props }: TestimonialCardProps) {
  return (
    <article
      className={cn('bg-card border p-6 sm:p-8 rounded-2xl transition-all duration-300', className)}
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
      className="block space-y-4 sm:space-y-6 transition-transform focus-visible:outline-ring/50"
    >
      <header className={cn('flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6', className)}>
        <Avatar className="size-10 sm:size-12 rounded-full flex-shrink-0">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">{name}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            @
            {login}
          </p>
        </div>
      </header>
      <div className="relative">
        <RiDoubleQuotesL className="size-5 sm:size-6 text-primary/20 absolute -top-1 sm:-top-2 -left-1 sm:-left-2" aria-hidden="true" />
        <blockquote className="text-foreground leading-relaxed pl-3 sm:pl-4 text-sm sm:text-base">
          {children}
        </blockquote>
      </div>
    </a>
  )
}

function JoinTestimonials() {
  return (
    <div className="space-y-4 sm:space-y-6 flex items-center justify-center min-h-full">
      <div className="text-center">
        <div className="size-10 sm:size-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <RiTwitterXLine className="size-5 sm:size-6 text-primary" aria-hidden="true" />
        </div>
        <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Want to be featured here?</h3>
        <Button asChild variant="link">
          <a
            href={constants.TWITTER_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Tag @conar_app on
            <RiTwitterXLine className="size-3 sm:size-4" aria-hidden="true" />
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
    avatar: '/avatars/dominikdoesdev.png',
    link: 'https://x.com/DominikDoesDev/status/1942986868758372850',
    children: () => 'Not gonna lie I was looking for something like @conar_app a while ago but couldn\'t find it until now. I think I am in love with this 😍',
  },
]

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="py-8 sm:py-12 lg:py-16">
      <div className="mb-12 sm:mb-16 text-center px-4">
        <h2 id="testimonials-heading" className="text-center mb-3 text-muted-foreground text-sm uppercase tracking-wide font-medium">
          Testimonials
        </h2>
        <p className="text-center text-balance text-3xl sm:text-4xl md:text-5xl font-bold max-w-3xl mx-auto leading-tight">
          Loved by developers worldwide
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto px-4">
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
