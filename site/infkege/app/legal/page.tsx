'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Section {
  title: string;
  content: string[];
}

interface Document {
  title: string;
  subtitle: string;
  sections: Section[];
}

interface Entrepreneur {
  fullName: string;
  shortName: string;
  inn: string;
  ogrnip: string;
  registrationDate: string;
  address: string;
}

interface Contacts {
  title: string;
  data: string[];
}

interface OfertaData {
  lastUpdated: string;
  entrepreneur: Entrepreneur;
  oferta: Document;
  userAgreement: Document;
  contacts: Contacts;
}

type Tab = 'oferta' | 'agreement';

export default function LegalPage() {
  const [data, setData] = useState<OfertaData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('oferta');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/oferta.json')
      .then((res) => res.json())
      .then((json: OfertaData) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-action border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">Не удалось загрузить документы</p>
      </div>
    );
  }

  const currentDoc = activeTab === 'oferta' ? data.oferta : data.userAgreement;

  return (
    <div className="py-12 layout-container">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        На главную
      </Link>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border-main">
        <button
          onClick={() => setActiveTab('oferta')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'oferta'
              ? 'text-text-primary border-b-2 border-action -mb-px'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Публичная оферта
        </button>
        <button
          onClick={() => setActiveTab('agreement')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'agreement'
              ? 'text-text-primary border-b-2 border-action -mb-px'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Пользовательское соглашение
        </button>
      </div>

      {/* Document */}
      <div className="bg-bg-secondary rounded-xl p-6 md:p-8">
        <header className="text-center mb-8 pb-6 border-b border-border-main">
          <h1 className="text-2xl md:text-3xl font-medium text-text-primary tracking-tight mb-2">
            {currentDoc.title}
          </h1>
          <p className="text-text-secondary text-[15px]">{currentDoc.subtitle}</p>
          <p className="text-sm text-text-secondary/60 mt-4">
            Редакция от {data.lastUpdated}
          </p>
        </header>

        {/* Entrepreneur Info */}
        <div className="bg-page-bg rounded-lg p-4 mb-8 border border-border-main">
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{data.entrepreneur.shortName}</span>
            <br />
            ИНН: {data.entrepreneur.inn} | ОГРНИП: {data.entrepreneur.ogrnip}
            <br />
            {data.entrepreneur.address}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {currentDoc.sections.map((section, idx) => (
            <section key={idx}>
              <h2 className="text-base font-medium text-text-primary mb-3">
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.content.map((paragraph, pIdx) => (
                  <p
                    key={pIdx}
                    className={`text-[15px] text-text-secondary leading-relaxed ${
                      paragraph.match(/^\d+\.\d+\.\d+\./)
                        ? 'pl-6'
                        : paragraph.match(/^\d+\.\d+\./)
                        ? 'pl-3'
                        : ''
                    }`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contacts */}
        <footer className="mt-10 pt-6 border-t border-border-main">
          <h3 className="text-base font-medium text-text-primary mb-3">
            {data.contacts.title}
          </h3>
          <div className="bg-page-bg rounded-lg p-4 border border-border-main">
            {data.contacts.data.map((line, idx) => (
              <p key={idx} className="text-sm text-text-secondary">
                {line}
              </p>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
