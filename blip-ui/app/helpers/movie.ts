import {Platform} from "@/models/Platform";

export function generatePlatformUrl(platform: Platform, movieTitle: string): string | null {
  switch (platform) {
    case Platform.NETFLIX:
      return `https://www.netflix.com/search?q=${movieTitle}`;
    case Platform.DISNEY_PLUS:
      return `https://www.disneyplus.com/search?q=${movieTitle}`;
    case Platform.HULU:
      return `https://www.hulu.com/search?q=${movieTitle}`;
    case Platform.HBO_MAX:
      return `https://www.hbomax.com/search?q=${movieTitle}`;
    case Platform.APPLE_TV:
      return `https://tv.apple.com/search/${movieTitle}`;
    case Platform.PRIME_VIDEO:
      return `https://www.primevideo.com/storefront/search?q=${movieTitle}`;
    case Platform.PARAMOUNT_PLUS:
      return `https://www.paramountplus.com/search?q=${movieTitle}`;
    case Platform.YOUTUBE:
      return `https://www.youtube.com/results?search_query=${movieTitle}`;
    default:
      return null;
  }
}

const platformImages: { [key in Platform]: any } = {
  [Platform.NETFLIX]: require('../../assets/images/netflix.png'),
  [Platform.DISNEY_PLUS]: require('../../assets/images/disney-plus.png'),
  //[Platform.HULU]: require('../../assets/images/hulu.png'),
  //[Platform.HBO_MAX]: require('../../assets/images/hbo-max.png'),
  //[Platform.APPLE_TV]: require('../../assets/images/apple-tv.png'),
  [Platform.PRIME_VIDEO]: require('../../assets/images/prime-video.png'),
  //[Platform.PARAMOUNT_PLUS]: require('../../assets/images/paramount-plus.png'),
  //[Platform.YOUTUBE]: require('../../assets/images/youtube.png'),
};

export const toImageSource = (platform: Platform): any => {
  return platformImages[platform];
};

