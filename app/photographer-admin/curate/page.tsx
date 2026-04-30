export default function CuratePage() {
  return (
    <main className="flex-1 min-h-screen overflow-y-auto p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Editorial Header Section */}
        <section className="mb-12">
          <span className="text-xs font-extrabold tracking-widest uppercase mb-2 block" style={{ color: '#b10e6b' }}>
            Workflow Step 02
          </span>
          <h1 className="font-serif text-5xl md:text-6xl leading-tight mb-4" style={{ color: '#211a1b' }}>
            Refine Your{' '}
            <span className="italic" style={{ color: '#d23284' }}>Visual Story</span>
          </h1>
          <p className="text-lg max-w-2xl leading-relaxed" style={{ color: '#53434e' }}>
            Organize, edit, and arrange your photos to create a seamless narrative. Every image contributes to the emotional journey of your collection.
          </p>
        </section>

        {/* Collections Grid */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-3xl" style={{ color: '#211a1b' }}>
              Your Collections
            </h2>
            <p className="text-sm" style={{ color: '#9d8e93' }}>
              0 albums created
            </p>
          </div>

          {/* Empty State */}
          <div
            className="rounded-xl shadow-sm p-16 text-center flex flex-col items-center justify-center min-h-96"
            style={{ backgroundColor: '#ffffff' }}
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#f7ecef' }}>
              <span className="material-symbols-outlined text-4xl" style={{ color: '#b10e6b' }}>
                collections_bookmark
              </span>
            </div>
            <h3 className="font-serif text-2xl mb-3" style={{ color: '#211a1b' }}>
              No Collections Yet
            </h3>
            <p className="text-sm max-w-md mb-8" style={{ color: '#9d8e93' }}>
              Start creating your first curated collection to begin organizing your memories into beautiful digital albums.
            </p>
            <a href="/photographer-admin/gallery/new-collection">
              <button
                className="px-8 py-3 text-sm font-bold uppercase tracking-widest text-white rounded-lg transition-transform active:scale-95 shadow-lg"
                style={{
                  background: 'linear-gradient(to right, #b10e6b, #d23284)',
                  boxShadow: '0 4px 12px rgba(177, 14, 107, 0.2)',
                }}
              >
                Create Your First Collection
              </button>
            </a>
          </div>
        </section>

        {/* Curation Tips Section */}
        <section>
          <div className="mb-8">
            <h2 className="font-serif text-3xl mb-2" style={{ color: '#211a1b' }}>
              Curation <span className="italic" style={{ color: '#b10e6b' }}>Tips</span>
            </h2>
            <p className="text-sm" style={{ color: '#9d8e93' }}>
              Learn how to curate your collections like a professional photographer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: 'auto_awesome',
                title: 'Create Thematic Groups',
                desc: 'Organize photos by moment, location, or emotion to tell a cohesive story',
              },
              {
                icon: 'tune',
                title: 'Master Your Edits',
                desc: 'Apply consistent color grading and filters across your collection',
              },
              {
                icon: 'preview',
                title: 'Preview & Adjust',
                desc: 'Review your arrangement and make final tweaks before publishing',
              },
            ].map((tip, idx) => (
              <div
                key={idx}
                className="p-8 rounded-xl shadow-sm"
                style={{ backgroundColor: '#ffffff' }}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ backgroundColor: '#f7ecef' }}>
                  <span className="material-symbols-outlined" style={{ color: '#b10e6b' }}>
                    {tip.icon}
                  </span>
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: '#211a1b' }}>
                  {tip.title}
                </h3>
                <p className="text-sm" style={{ color: '#9d8e93' }}>
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
