const CATEGORY_DEFINITIONS = {
  graduation: {
    label: 'Graduation & Student Life', icon: '🎓', category: 'education',
    query: 'graduation OR convocation OR commencement OR graduate OR alumni OR student life', countries: ['ng', 'us', 'gb'],
  },
  jobs: {
    label: 'Jobs & Internships', icon: '💼', category: 'business',
    query: 'jobs OR internship OR internships OR "graduate programme" OR "graduate program" OR entry-level', countries: ['ng', 'us', 'gb'],
  },
  relationships: {
    label: 'Relationships & Young Adult Life', icon: '❤️', category: 'lifestyle',
    query: 'relationships OR dating OR friendship OR marriage OR young adults OR student relationships', countries: ['ng', 'us', 'gb'],
  },
  scholarships: {
    label: 'Scholarships & Opportunities', icon: '🎓', category: 'education',
    query: 'scholarship OR scholarships OR fellowship OR grant OR study abroad', countries: ['ng', 'us', 'gb'],
  },
  technology: {
    label: 'Technology & Skills', icon: '💻', category: 'technology',
    query: 'artificial intelligence OR software OR cybersecurity OR coding OR technology skills', countries: ['ng', 'us', 'gb'],
  },
  entrepreneurship: {
    label: 'Business & Entrepreneurship', icon: '🚀', category: 'business',
    query: 'startup OR entrepreneurship OR small business OR founders', countries: ['ng', 'us', 'gb'],
  },
  competitions: {
    label: 'Competitions & Challenges', icon: '🏆', category: 'education',
    query: 'competition OR hackathon OR challenge OR contest OR student competition', countries: ['ng', 'us', 'gb'],
  },
};

const DEFAULT_LIMIT = 10;
const DEFAULT_CACHE_MINUTES = 60;

function getNewsFeedConfig() {
  return {
    apiKey: process.env.NEWSDATA_API_KEY || '',
    baseUrl: process.env.NEWSDATA_API_URL || 'https://newsdata.io/api/1/latest',
    cacheMinutes: Number(process.env.NEWS_FEEDS_CACHE_MINUTES || DEFAULT_CACHE_MINUTES),
    defaultCountries: (process.env.NEWS_FEEDS_COUNTRIES || 'ng,us,gb')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    language: process.env.NEWS_FEEDS_LANGUAGE || 'en',
    limit: Math.min(Math.max(Number(process.env.NEWS_FEEDS_LIMIT || DEFAULT_LIMIT), 1), 10),
  };
}

module.exports = {
  CATEGORY_DEFINITIONS,
  getNewsFeedConfig,
};
