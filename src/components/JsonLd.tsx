import {
  SITE_ALTERNATE_NAME,
  SITE_EMAIL,
  SITE_GITHUB,
  SITE_JOB_TITLE,
  SITE_NAME,
  SITE_SKILLS,
  SITE_URL,
  absoluteUrl,
} from "@/lib/site";

export default function JsonLd() {
  const personId = `${SITE_URL}/#person`;
  const websiteId = `${SITE_URL}/#website`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        jobTitle: SITE_JOB_TITLE,
        email: SITE_EMAIL,
        url: SITE_URL,
        image: absoluteUrl("/avatar.jpg"),
        sameAs: [SITE_GITHUB],
        knowsAbout: SITE_SKILLS,
        alumniOf: {
          "@type": "CollegeOrUniversity",
          name: "Zhejiang University of Science and Technology",
        },
        worksFor: {
          "@type": "Organization",
          name: "Mufy AI",
          url: "https://chat.mufy.ai/",
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: ["en", "zh-CN"],
        publisher: { "@id": personId },
      },
      {
        "@type": "ProfilePage",
        "@id": absoluteUrl("/#profile"),
        url: SITE_URL,
        name: `${SITE_NAME} — Portfolio`,
        inLanguage: ["en", "zh-CN"],
        mainEntity: { "@id": personId },
        isPartOf: { "@id": websiteId },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
