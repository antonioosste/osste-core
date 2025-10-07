import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Helmet } from "react-helmet";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface Page {
  title: string;
  body_markdown: string;
  seo_description: string;
}

const Privacy = () => {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("title, body_markdown, seo_description")
        .eq("slug", "privacy")
        .eq("is_published", true)
        .single();

      if (error) {
        console.error("Error fetching privacy page:", error);
      } else {
        setPage(data);
      }
      setLoading(false);
    };

    fetchPage();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground">
              The privacy policy page could not be found.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{page.title} | OSSTE</title>
        <meta name="description" content={page.seo_description} />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container max-w-4xl mx-auto px-4">
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown>{page.body_markdown}</ReactMarkdown>
            </article>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Privacy;
