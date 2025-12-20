import type { ComponentProps } from 'react'
import { useId } from 'react'

export function AppLogoSquare(props: ComponentProps<'svg'>) {
  const id = useId()

  return (
    <svg
      width="824"
      height="824"
      viewBox="0 0 824 824"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="824" height="824" rx="200" fill={`url(#a-${id})`} />
      <g filter={`url(#b-${id})`}>
        <path
          d="M516.297 336.544a5.205 5.205 0 0 0 3.678-6.052c-3.818-18.64-19.972-60.839-55.905-99.919-17.421-20.013-50.062-41.719-81.034-59.63-31.883-18.436-65.404-34.757-86.825-43.381a5.205 5.205 0 0 0-7.151 4.913l1.413 87.896a5.207 5.207 0 0 0 3.098 4.677c69.318 30.695 115.016 58.065 143.805 79.419 14.401 10.682 24.339 19.687 30.828 26.652 3.385 3.633 5.589 6.454 6.969 8.444.69.996 1.165 1.77 1.475 2.323.328.586.423.836.407.794a5.209 5.209 0 0 0 6.312 3.216l32.93-9.352Z"
          fill={`url(#c-${id})`}
        />
        <path
          d="M375.621 289.632c-.072-2.735-2.226-4.951-4.939-5.083-18.95-.921-63.706 4.299-110.331 29.533-23.634 11.97-52.662 38.321-77.61 63.995-25.682 26.428-49.725 54.975-63.344 73.667a5.256 5.256 0 0 0-.687 4.894 5.204 5.204 0 0 0 3.668 3.284l85.263 20.482a5.171 5.171 0 0 0 5.283-1.851c46.766-59.793 84.489-97.438 112.225-120.131 13.875-11.352 25.027-18.779 33.358-23.359 4.346-2.389 7.615-3.831 9.879-4.679a29.164 29.164 0 0 1 2.607-.857c.54-.145.814-.19.865-.198.01-.001.011-.002.004-.001 2.702-.277 4.736-2.605 4.664-5.34l-.905-34.356Z"
          fill={`url(#d-${id})`}
        />
        <path
          d="M292.527 420.579a5.207 5.207 0 0 0-6.357 3.126c-6.809 17.774-15.891 62.055-6.624 114.346 3.92 26.251 19.758 62.118 36.233 93.886 16.959 32.701 36.435 64.499 49.854 83.296a5.208 5.208 0 0 0 8.671-.296l46.091-74.891a5.21 5.21 0 0 0-.096-5.611c-41.92-63.179-65.719-110.848-78.5-144.345-6.394-16.757-9.927-29.697-11.65-39.063-.899-4.885-1.24-8.45-1.332-10.871-.047-1.211-.03-2.12.006-2.752.038-.671.093-.933.084-.89a5.208 5.208 0 0 0-3.591-6.107l-32.789-9.828Z"
          fill={`url(#e-${id})`}
        />
        <path
          d="M381.352 526.554a5.163 5.163 0 0 0 .961 6.978c14.692 11.994 53.773 34.436 106.211 42.07 26.095 4.523 65.044.811 100.311-4.785 36.305-5.76 72.546-14.18 94.569-20.955a5.187 5.187 0 0 0 3.452-3.485 5.165 5.165 0 0 0-1.005-4.792l-56.43-66.956a5.208 5.208 0 0 0-5.344-1.667c-73.02 19.771-125.651 27.298-161.395 28.867-17.881.785-31.248.065-40.66-1.242-4.909-.682-8.392-1.477-10.714-2.148a29.284 29.284 0 0 1-2.605-.868 8.868 8.868 0 0 1-.816-.357 5.21 5.21 0 0 0-6.914 1.475l-19.621 27.865Z"
          fill={`url(#f-${id})`}
        />
        <path
          d="M528.354 472.642a5.24 5.24 0 0 0 7.012 1.248c16.092-10.339 49.793-40.779 73.386-88.605 12.437-23.575 20.935-62.015 26.478-97.516 5.706-36.544 8.833-73.853 9.138-97.039a5.227 5.227 0 0 0-2.283-4.387 5.242 5.242 0 0 0-4.922-.527l-81.908 33.221a5.227 5.227 0 0 0-3.259 4.597c-3.602 76.044-12.667 128.766-22.232 163.471-4.785 17.361-9.619 29.934-13.793 38.537-2.177 4.488-4.022 7.576-5.387 9.59a29.509 29.509 0 0 1-1.642 2.224c-.358.433-.557.63-.594.667a5.225 5.225 0 0 0-.725 7.08l20.731 27.439Z"
          fill={`url(#g-${id})`}
        />
      </g>
      <defs>
        <linearGradient
          id={`a-${id}`}
          x1="824"
          y1="824"
          x2="0"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#5689FF" />
          <stop offset="1" stopColor="#1E40B0" />
        </linearGradient>
        <linearGradient
          id={`c-${id}`}
          x1="310.538"
          y1="323.282"
          x2="705.617"
          y2="650.298"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#C5D7F1" />
        </linearGradient>
        <linearGradient
          id={`d-${id}`}
          x1="310.538"
          y1="323.282"
          x2="705.617"
          y2="650.298"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#C5D7F1" />
        </linearGradient>
        <linearGradient
          id={`e-${id}`}
          x1="310.538"
          y1="323.282"
          x2="705.617"
          y2="650.298"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#C5D7F1" />
        </linearGradient>
        <linearGradient
          id={`f-${id}`}
          x1="310.538"
          y1="323.282"
          x2="705.617"
          y2="650.298"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#C5D7F1" />
        </linearGradient>
        <linearGradient
          id={`g-${id}`}
          x1="310.538"
          y1="323.282"
          x2="705.617"
          y2="650.298"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#C5D7F1" />
        </linearGradient>
        <filter
          id={`b-${id}`}
          x="97.392"
          y="107.186"
          width="638.676"
          height="660.229"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="14" dy="15" />
          <feGaussianBlur stdDeviation="17.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_2844_167" />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="4" dy="5" />
          <feGaussianBlur stdDeviation="5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
          <feBlend in2="effect1_dropShadow_2844_167" result="effect2_dropShadow_2844_167" />
          <feBlend in="SourceGraphic" in2="effect2_dropShadow_2844_167" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="-9" dy="-7" />
          <feGaussianBlur stdDeviation="9.2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix values="0 0 0 0 0.0478458 0 0 0 0 0.128002 0 0 0 0 0.331731 0 0 0 0.15 0" />
          <feBlend in2="shape" result="effect3_innerShadow_2844_167" />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="-3" dy="-2" />
          <feGaussianBlur stdDeviation="4" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
          <feBlend
            mode="soft-light"
            in2="effect3_innerShadow_2844_167"
            result="effect4_innerShadow_2844_167"
          />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="-1" dy="-1" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
          <feBlend
            mode="soft-light"
            in2="effect4_innerShadow_2844_167"
            result="effect5_innerShadow_2844_167"
          />
        </filter>
      </defs>
    </svg>
  )
}
