"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Bank,
  MagnifyingGlass,
  FileText,
  IdentificationCard,
  Notebook,
  Question,
  Checks,
  Globe,
  SquaresFour
} from "@phosphor-icons/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Ripple } from "@/components/ui/ripple";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { ResizableNavbar } from "@/components/ui/resizable-navbar";

export default function MarketingPage() {
  const [lang, setLang] = useState<"en" | "si" | "ta">("en");
  const [searchQuery, setSearchQuery] = useState("");

  const content = {
    en: {
      heroTitle: "Citizen services",
      heroTitleAccent: "at your fingertips",
      heroSubtitle: "Access all Sri Lankan government departments through a single, conversational AI workspace. OCR verification, real-time checklists, and tracked delivery.",
      searchPlaceholder: "Search passport renewal, NIC status, birth records...",
      servicesHeading: "Government Services Directory",
      generalCta: "Open General Inquiry Console",
      generalCtaDesc: "Not sure what you need? Open a conversation with our central agent dispatcher to check your eligibility, query regulations, and build step checklists.",
      officialNotice: "Official Centralised Government Portal. Sri Lanka Civil Services.",
      services: [
        {
          id: "passport-renewal",
          name: "Passport Renewal",
          agency: "Department of Immigration & Emigration",
          fee: "LKR 10,000",
          time: "3-5 Business Days",
          desc: "Apply for a standard citizen passport renewal. Upload your current passport, NIC, and birth certificate for instant OCR verification.",
          icon: Notebook
        },
        {
          id: "nic-application",
          name: "National Identity Card (NIC)",
          agency: "Department of Registration of Persons",
          fee: "LKR 2,000",
          time: "7-10 Business Days",
          desc: "Request a new or replacement National Identity Card (NIC). Cross-references biometric data and Grama Niladhari residency certs.",
          icon: IdentificationCard
        },
        {
          id: "birth-cert-copy",
          name: "Birth Certificate Copy Request",
          agency: "Department of Registrar General",
          fee: "LKR 1,500",
          time: "2-3 Business Days",
          desc: "Request a certified duplicate copy of birth records from registry archives. Speeds up official certificate requests.",
          icon: FileText
        }
      ]
    },
    si: {
      heroTitle: "පුරවැසි සේවාවන්",
      heroTitleAccent: "ඔබේ ඇඟිලි තුඩුවල",
      heroSubtitle: "එක් සංවාදශීලී AI සහායකයෙකු හරහා සියලුම ශ්‍රී ලංකා රාජ්‍ය දෙපාර්තමේන්තු වෙත ප්‍රවේශ වන්න. OCR ලේඛන සත්‍යාපනය සහ නිවසටම බෙදා හැරීම.",
      searchPlaceholder: "විදේශ ගමන් බලපත්‍ර, ජාතික හැඳුනුම්පත්, සිවිල් ලේඛන සොයන්න...",
      servicesHeading: "රාජ්‍ය සේවා නාමාවලිය",
      generalCta: "පොදු විමසීම් කොන්සෝලය විවෘත කරන්න",
      generalCtaDesc: "ඔබට අවශ්‍ය කුමක්දැයි විශ්වාස නැද්ද? අවශ්‍යතා සෙවීමට, සුදුසුකම් පරීක්ෂා කිරීමට සහ පරීක්ෂණ ලැයිස්තු සකස් කිරීමට අපගේ මධ්‍යම AI සහායකයා සමඟ සාකච්ඡා කරන්න.",
      officialNotice: "නිල මධ්‍යගත රාජ්‍ය ද්වාරය. ශ්‍රී ලංකා සිවිල් සේවා.",
      services: [
        {
          id: "passport-renewal",
          name: "විදේශ ගමන් බලපත්‍ර අලුත් කිරීම",
          agency: "ආගමන හා විගමන දෙපාර්තමේන්තුව",
          fee: "රු. 10,000",
          time: "දින 3 - 5",
          desc: "විදේශ ගමන් බලපත්‍රය අලුත් කිරීම සඳහා අයදුම් කරන්න. ඔබගේ ජාතික හැඳුනුම්පත සහ උප්පැන්න සහතිකය OCR තාක්ෂණයෙන් තහවුරු කරන්න.",
          icon: Notebook
        },
        {
          id: "nic-application",
          name: "ජාතික හැඳුනුම්පත (NIC)",
          agency: "පුද්ගලයින් ලියාපදිංචි කිරීමේ දෙපාර්තමේන්තුව",
          fee: "රු. 2,000",
          time: "දින 7 - 10",
          desc: "නව හෝ නැතිවූ ජාතික හැඳුනුම්පතක් සඳහා අයදුම් කරන්න. ග්‍රාම නිලධාරී සහතික සහ ජෛවමිතික දත්ත සම්බන්ධීකරණය කෙරේ.",
          icon: IdentificationCard
        },
        {
          id: "birth-cert-copy",
          name: "උප්පැන්න සහතික පිටපතක් ලබා ගැනීම",
          agency: "රෙජිස්ට්‍රාර් ජනරාල් දෙපාර්තමේන්තුව",
          fee: "රු. 1,500",
          time: "දින 2 - 3",
          desc: "ලේඛනාගාරයෙන් සහතික කළ උප්පැන්න සහතික පිටපතක් ඇණවුම් කරන්න. රාජ්‍ය සහතික ඉල්ලීම් කඩිනම් කෙරේ.",
          icon: FileText
        }
      ]
    },
    ta: {
      heroTitle: "குடிமக்கள் சேவைகள்",
      heroTitleAccent: "உங்கள் விரல் நுனியில்",
      heroSubtitle: "ஒற்றை AI உரையாடல் தளம் மூலம் அனைத்து இலங்கை அரசாங்க திணைக்களங்களையும் அணுகவும். OCR ஆவண சரிபார்ப்பு மற்றும் கண்காணிப்பு விநியோகம்.",
      searchPlaceholder: "கடவுச்சீட்டு, தேசிய அடையாள அட்டை, சிவில் பதிவேடுகளைத் தேடுக...",
      servicesHeading: "அரசு சேவைகள் விபரக்கொத்து",
      generalCta: "பொதுவான விசாரணையைத் தொடங்குக",
      generalCtaDesc: "உங்களுக்கு என்ன தேவை என்று தெரியவிடில், எமது மத்திய AI உதவியாளருடன் உரையாடி தகுதியைச் சரிபார்த்து ஆவணப் பட்டியல்களை உருவாக்குங்கள்.",
      officialNotice: "அதிகாரப்பூர்வ மத்திய அரசு போர்டல். இலங்கை சிவில் சேவைகள்.",
      services: [
        {
          id: "passport-renewal",
          name: "கடவுச்சீட்டு புதுப்பித்தல்",
          agency: "குடிவரவு மற்றும் குடியகல்வு திணைக்களம்",
          fee: "LKR 10,000",
          time: "3-5 வேலை நாட்கள்",
          desc: "குடிමக்களுக்கான சாதாரண கடவுச்சீட்டைப் புதுப்பிக்கவும். தேசிய அடையாள அட்டை மற்றும் பிறப்புச் சான்றிதழை OCR மூலம் சரிபார்க்கவும்.",
          icon: Notebook
        },
        {
          id: "nic-application",
          name: "தேசிய அடையாள அட்டை (NIC)",
          agency: "நபர்களைப் பதிவு செய்யும் திணைக்களம்",
          fee: "LKR 2,000",
          time: "7-10 வேலை நாட்கள்",
          desc: "புதிய அல்லது மாற்று தேசிய அடையாள அட்டைக்கு விண்ணப்பிக்கவும். கிராம நிலதாரி வதிவிட சான்றிதழ் சரிபார்ப்பை உள்ளடக்கியது.",
          icon: IdentificationCard
        },
        {
          id: "birth-cert-copy",
          name: "பிறப்புச் சான்றிதழ் நகல் கோரிக்கை",
          agency: "பதிவாளர் நாயகம் திணைக்களம்",
          fee: "LKR 1,500",
          time: "2-3 வேலை நாட்கள்",
          desc: "பதிவேட்டில் இருந்து பிறப்புச் சான்றிதழ் நகலைக் கோரவும். அதிகாரப்பூர்வ நகல்களை விரைவாகப் பெறுவதற்குப் பயன்படும்.",
          icon: FileText
        }
      ]
    }
  };

  const currentContent = content[lang];

  const faqContent = {
    en: {
      heading: "Frequently Asked Questions",
      items: [
        { q: "What documents do I need?", a: "Required documents are populated dynamically based on the service. For Passport Renewal, this includes your NIC and Birth Certificate." },
        { q: "How long does automated verification take?", a: "OCR check validation runs in real-time, taking approximately 6 seconds to extract and cross-reference your records." },
        { q: "Is the portal secure?", a: "Yes. All uploads are encrypted and direct verification is completed securely via official government registers." }
      ]
    },
    si: {
      heading: "නිතර අසන ප්‍රශ්න (FAQ)",
      items: [
        { q: "මට අවශ්‍ය ලේඛන මොනවාද?", a: "අවශ්‍ය ලේඛන සේවාව අනුව වෙනස් වේ. ගමන් බලපත්‍ර අලුත් කිරීම සඳහා හැඳුනුම්පත සහ උප්පැන්න සහතිකය අවශ්‍ය වේ." },
        { q: "ස්වයංක්‍රීය සත්‍යාපනය සඳහා කොපමණ කාලයක් ගතවේද?", a: "OCR පරිලෝකනය සජීවීව ක්‍රියාත්මක වන අතර තොරතුරු තහවුරු කිරීමට තත්පර 6ක් පමණ ගතවේ." },
        { q: "මෙම ද්වාරය ආරක්ෂිතද?", a: "ඔව්, ඔබ උඩුගත කරන සියලුම ලිපිගොනු සංකේතනය කර ඇති අතර රාජ්‍ය දත්ත පද්ධති මගින් පමණක් සත්‍යාපනය සිදු කරයි." }
      ]
    },
    ta: {
      heading: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
      items: [
        { q: "எனக்கு என்ன ஆவணங்கள் தேவை?", a: "தேவையான ஆவணங்கள் சேவைக்கு ஏற்ப மாறுபடும். கடவுச்சீட்டு புதுப்பித்தலுக்கு அடையாள அட்டை மற்றும் பிறப்புச் சான்றிதழ் தேவை." },
        { q: "தானியங்கி சரிபார்ப்புக்கு எவ்வளவு நேரம் ஆகும்?", a: "OCR ஸ்கேனிங் நிகழ்நேரத்தில் இயங்கும், ஆவணங்களைச் சரிபார்க்க சுமார் 6 வினாடிகள் ஆகும்." },
        { q: "இந்த போர்டல் பாதுகாப்பானதா?", a: "ஆம், பதிவேற்றப்படும் அனைத்து ஆவணங்களும் குறியாக்கம் செய்யப்பட்டு அரசாங்க நெறிமுறைகளின்படி சரிபார்க்கப்படும்." }
      ]
    }
  };

  const filteredServices = currentContent.services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex flex-col min-h-dvh bg-zinc-950 text-white font-sans transition-colors duration-200 ${
      lang === "si" ? "font-sinhala" : lang === "ta" ? "font-tamil" : "font-sans"
    }`}>
      {/* Resizable Floating Navbar */}
      <ResizableNavbar
        lang={lang}
        setLang={setLang}
        navItems={[
          { name: "Services", link: "#services" },
          { name: "FAQ", link: "#faq" },
          { name: "Docs", link: "#docs" }
        ]}
      />

      {/* Hero Illustration Background Section */}
      <section className="relative min-h-[92vh] flex flex-col justify-center items-center px-6 lg:px-12 bg-zinc-950 overflow-hidden border-b border-zinc-900/50">
        
        {/* Magic UI Ripple Background */}
        <Ripple className="opacity-70" />
        
        {/* Center luminous radial glow overlay to make it much brighter */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_65%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto w-full relative z-10 space-y-6 pt-16 flex flex-col items-center justify-center text-center">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[0.9] text-white">
            {currentContent.heroTitle}
            <span className="block text-zinc-400">{currentContent.heroTitleAccent}</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-450 leading-relaxed max-w-[65ch] mx-auto">
            {currentContent.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 border border-zinc-800 hover:bg-zinc-900 rounded font-bold text-xs text-white transition-all active:scale-[0.98]"
            >
              <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-slate-950">
                <SquaresFour className="w-3.5 h-3.5" weight="fill" />
              </div>
              <span>Open Workspace</span>
            </Link>

            <a
              href="#services"
              className="inline-flex items-center justify-center text-xs font-bold text-zinc-400 hover:text-white transition-colors h-11 px-4"
            >
              <span>Explore Services Catalog →</span>
            </a>
          </div>
        </div>
      </section>

      {/* Unified Search Section */}
      <section className="bg-zinc-950 py-10 border-b border-zinc-900/50 px-6">
        <div className="max-w-xl mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <MagnifyingGlass className="w-5 h-5" weight="bold" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={currentContent.searchPlaceholder}
            className="w-full h-12 pl-11 pr-4 bg-zinc-900/80 text-white placeholder-zinc-500 border border-zinc-800 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm transition-all shadow-sm"
          />
        </div>
      </section>

      {/* Bento Grid Directory */}
      <main id="services" className="max-w-7xl mx-auto px-6 py-16 flex-grow space-y-12 relative z-10 w-full">
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight uppercase">
            {currentContent.servicesHeading}
          </h2>

          {filteredServices.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-500">
              No matching government services found.
            </div>
          ) : (
            <BentoGrid>
              {/* Bento Cell 1: Main Dispatcher Prompt (Spans 2 columns) */}
              <BentoCard
                name={currentContent.generalCta}
                description={currentContent.generalCtaDesc}
                className="col-span-3 md:col-span-2"
                Icon={SquaresFour}
                href="/chat/new"
                cta="Ask Central Dispatcher"
                background={
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    {/* Pulsing high-tech radar vector */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-zinc-700 animate-pulse" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-zinc-800 border-dashed animate-spin [animation-duration:16s]" />
                    <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                      Central Agent Router
                    </div>
                  </div>
                }
              />

              {/* Bento Cell 2: Quick Information Card (Spans 1 column) */}
              <BentoCard
                name="Need Assistance?"
                description="Our system evaluates citizen documents, calculates processing fees, and schedules local physical biometric registrations automatically."
                className="col-span-3 md:col-span-1"
                Icon={Question}
                href="#faq"
                cta="View FAQ"
                background={
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                    {/* Stacked decorative mock files */}
                    <div className="absolute -bottom-6 -right-2 w-36 h-24 border border-zinc-800 bg-zinc-950/50 rounded-xl transform -rotate-12 flex flex-col justify-between p-3">
                      <div className="w-1/2 h-2 bg-zinc-850 rounded" />
                      <div className="w-5/6 h-1.5 bg-zinc-850 rounded" />
                      <div className="w-2/3 h-1.5 bg-zinc-850 rounded" />
                    </div>
                    <div className="absolute -bottom-2 -right-8 w-36 h-24 border border-zinc-800 bg-zinc-950/60 rounded-xl transform rotate-6 flex flex-col justify-between p-3">
                      <div className="w-1/3 h-2 bg-zinc-800 rounded" />
                      <div className="w-4/5 h-1.5 bg-zinc-800 rounded" />
                      <div className="w-1/2 h-1.5 bg-zinc-800 rounded" />
                    </div>
                    <div className="absolute top-6 right-6 text-[9px] font-extrabold uppercase tracking-widest text-zinc-550">
                      GovPilot AI Platform
                    </div>
                  </div>
                }
              />

              {/* Catalog Services */}
              {filteredServices.map((service) => (
                <BentoCard
                  key={service.id}
                  name={service.name}
                  description={service.desc}
                  className="col-span-3 md:col-span-1"
                  Icon={service.icon}
                  href={`/chat/new?serviceId=${service.id}`}
                  cta="Start Application"
                  background={
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                      {service.id === "passport-renewal" ? (
                        /* Mock passport document card */
                        <div className="absolute -bottom-6 -right-6 w-36 h-28 border border-zinc-800 bg-zinc-950/50 rounded-2xl transform rotate-12 p-4 flex flex-col justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-[7px] text-amber-500 font-black">P</div>
                            <div className="w-16 h-1.5 bg-zinc-850 rounded" />
                          </div>
                          <div className="w-full h-1.5 bg-zinc-850 rounded" />
                          <div className="w-5/6 h-1.5 bg-zinc-850 rounded" />
                        </div>
                      ) : service.id === "nic-application" ? (
                        /* Mock identity card layout */
                        <div className="absolute -bottom-8 -right-8 w-44 h-28 border border-zinc-800 bg-zinc-950/50 rounded-2xl transform -rotate-6 p-4 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div className="w-20 h-1.5 bg-zinc-850 rounded" />
                            <div className="w-6 h-6 rounded bg-zinc-850/50 border border-zinc-800" />
                          </div>
                          <div className="space-y-1">
                            <div className="w-3/4 h-1 bg-zinc-850 rounded" />
                            <div className="w-1/2 h-1 bg-zinc-850 rounded" />
                          </div>
                        </div>
                      ) : (
                        /* Mock birth certificate document copy */
                        <div className="absolute -bottom-10 -right-6 w-36 h-32 border border-zinc-800 bg-zinc-950/50 rounded transform rotate-6 p-3 flex flex-col gap-2">
                          <div className="w-12 h-1.5 bg-zinc-850 rounded mx-auto" />
                          <div className="space-y-1.5 pt-2">
                            <div className="w-full h-1 bg-zinc-850 rounded" />
                            <div className="w-11/12 h-1 bg-zinc-850 rounded" />
                            <div className="w-5/6 h-1 bg-zinc-850 rounded" />
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute top-6 right-6 flex flex-col items-end gap-1 text-right">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {service.fee}
                        </span>
                        <span className="text-[9px] font-bold text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{service.time}</span>
                        </span>
                      </div>
                    </div>
                  }
                />
              ))}
            </BentoGrid>
          )}
        </div>
      </main>

      {/* FAQ Panel */}
      <div id="faq" className="max-w-3xl mx-auto py-16 px-6 border-t border-zinc-900 mt-16 space-y-6 relative z-10 w-full">
        <h3 className="text-xl font-bold text-white text-center tracking-tight uppercase">
          {faqContent[lang].heading}
        </h3>
        <Accordion className="w-full">
          {faqContent[lang].items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-zinc-900">
              <AccordionTrigger className="text-left font-bold text-zinc-300 hover:text-amber-500 text-sm py-4">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-zinc-450 text-sm leading-relaxed pb-4">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-6 relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-6 text-center text-[10px] text-zinc-550 font-bold tracking-wider uppercase">
          {currentContent.officialNotice}
        </div>
      </footer>
    </div>
  );
}
