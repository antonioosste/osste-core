import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface Page {
  title: string;
  body_markdown: string;
  seo_description: string;
}

export default function FAQ() {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("title, body_markdown, seo_description")
        .eq("slug", "faq")
        .eq("is_published", true)
        .single();

      if (error) {
        console.error("Error fetching FAQ page:", error);
      } else {
        setPage(data);
      }
      setLoading(false);
    };

    fetchPage();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!page) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Page not found</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{page.title} | OSSTE</title>
        <meta name="description" content={page.seo_description} />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-16">
          <article className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown>{page.body_markdown}</ReactMarkdown>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
