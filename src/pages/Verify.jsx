import { Link } from 'react-router-dom';
import AppNav from '../components/AppNav';
import AppFooter from '../components/AppFooter';
import { useTheme } from '../context/ThemeContext';

const STEPS = [
  {
    id: 'network',
    title: 'Watch the network while you use a tool',
    body: 'Every file the page needs — script, stylesheet, font, icon — should come from this site. Nothing you type is uploaded, and the page should not call out to Google, a font host, or an analytics service, including on the first load.',
    steps: [
      'Open a tool, for example Text Compare.',
      'Open developer tools. Right-click the page and choose Inspect, or press Ctrl+Shift+I (Windows and Linux) or Command+Option+I (Mac). F12 also works on Windows and Linux.',
      'Select the Network tab. Check "Preserve log" so a reload does not wipe the list. Click the clear button (the circle with a slash) so you start from an empty list.',
      'Reload the page. Paste two short sentences into the tool and run it — Compare, Format, Clean, or whatever that tool does.',
      'Read the list. Each row is one request. The domain is this site: openutils.tech on the public site, or localhost when you run a build yourself. Status "(service worker)" or "(disk cache)" is still this site.',
    ],
    extra: 'To make leftovers obvious, type this into the Network filter box: -domain:openutils.tech (use -domain:localhost for a local build). An empty list means nothing else was contacted. A hard reload (Ctrl+Shift+R, or Command+Shift+R on Mac) ignores an old cached copy if you visited before fonts were self-hosted. On Time Converter, the calendar and clock drawn on the date and time fields belong to the browser. Chrome lists them as data: images. They are not requests to another website, and that domain filter still comes back empty.',
  },
  {
    id: 'csp',
    title: 'Read the Content-Security-Policy header',
    body: 'The server tells the browser which addresses it may load. The policy for this site allows only this site itself. Scripts and styles have to be files we shipped. Inline styles are refused. The JSON-LD block in the page source is data for search engines. The browser does not run it, so script-src stays \'self\' with no inline-script exception, including when each page carries its own JSON-LD.',
    steps: [
      'Stay in developer tools and open the Network tab. Reload the page.',
      'Click the first row. Its type is document — that is the page itself, not a script or image.',
      'In the details pane, open Headers. Scroll to Response Headers (the ones the server sent back, not Request Headers).',
      'Find Content-Security-Policy. It should start with default-src \'self\' and should not name any other website. script-src, style-src, font-src, img-src, and connect-src should be \'self\'. object-src is \'none\', so plugins cannot be embedded. base-uri is \'self\', frame-ancestors is \'none\' (this page cannot be put in an iframe), and form-action is \'self\'.',
      'In the same list, Referrer-Policy should be no-referrer, X-Content-Type-Options should be nosniff, and Permissions-Policy should turn off camera, microphone, location, and the other device APIs. Clipboard write stays available so the Copy buttons work.',
      'Open the Console tab and use a tool again. A policy violation is a red message that says a resource was blocked. A normal visit has none.',
    ],
    extra: 'These headers are on the deployed site, and on a local production preview (npm run build, then npm run preview). npm run dev does not send them: the development server needs extra scripts for hot reload, so it is the wrong place to judge the policy.',
  },
  {
    id: 'offline',
    title: 'Use a tool with the network off',
    body: 'After one online visit, a service worker stores the app on your device. The tools then run with no connection. Installing the app is optional; an installed copy is the same pages, in their own window.',
    steps: [
      'Load the site once while you are online, then reload it so the service worker can take control. In developer tools, open Application (Chrome) or Storage (Firefox), then Service Workers. You should see a worker for this site, activated and running.',
      'To install: look for an install icon at the edge of the address bar. Otherwise open the browser menu and choose the entry that installs the site as an app. The label varies by browser.',
      'Go offline. In Chrome\'s Network tab, change "No throttling" to "Offline". Or, under Service Workers, check "Offline". You can also turn the computer\'s network off.',
      'Reload. The home page should still open. Open Text Compare (or any other tool) and run it. The result is computed in the page. The footer hash is still there, because it was baked in when the site was built.',
    ],
    extra: 'npm run dev does not register a service worker, so it cannot work offline. Use the deployed site, or npm run build and npm run preview, which serves the same headers as production.',
  },
];

export default function Verify() {
  const { darkMode } = useTheme();
  const card = darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200';
  const heading = darkMode ? 'text-zinc-100' : 'text-slate-900';
  const body = darkMode ? 'text-zinc-400' : 'text-slate-500';
  const step = darkMode ? 'text-zinc-300' : 'text-slate-600';
  const code = darkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-slate-100 text-slate-700';

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
      <AppNav />

      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 py-10">
        <div className="mb-8 max-w-2xl">
          <h1 className={`text-2xl font-bold tracking-tight mb-2 ${heading}`}>
            Verify it yourself
          </h1>
          <p className={`text-sm leading-relaxed ${body}`}>
            OpenUtils runs in your browser. There is no account and no tool API.
            The checks below take a few minutes and do not ask you to trust this paragraph.
            The short hash in the footer is the commit this build was made from. It links to that commit on GitHub, so you can see the code you are running.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {STEPS.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                darkMode
                  ? 'border-zinc-600 text-zinc-300 hover:bg-zinc-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {index + 1}. {section.title}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-4 max-w-3xl">
          {STEPS.map((section, index) => (
            <section key={section.id} id={section.id} className={`rounded-xl border p-5 scroll-mt-20 ${card}`}>
              <h2 className={`text-sm font-semibold mb-2 ${heading}`}>
                {index + 1}. {section.title}
              </h2>
              <p className={`text-xs leading-relaxed mb-4 ${body}`}>{section.body}</p>
              <ol className={`list-decimal pl-5 space-y-2 text-xs leading-relaxed mb-4 ${step}`}>
                {section.steps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <p className={`text-xs leading-relaxed ${body}`}>{section.extra}</p>
            </section>
          ))}

          <section className={`rounded-xl border p-5 ${card}`}>
            <h2 className={`text-sm font-semibold mb-2 ${heading}`}>What a pass looks like</h2>
            <ul className={`list-disc pl-5 space-y-2 text-xs leading-relaxed ${step}`}>
              <li>The Network list, after a reload and a tool run, only talks to this site. The filter <code className={`px-1 py-0.5 rounded font-mono text-[11px] ${code}`}>-domain:openutils.tech</code> is empty.</li>
              <li>The document response includes a Content-Security-Policy of <code className={`px-1 py-0.5 rounded font-mono text-[11px] ${code}`}>default-src &apos;self&apos;</code> with no other host, plus Referrer-Policy <code className={`px-1 py-0.5 rounded font-mono text-[11px] ${code}`}>no-referrer</code>.</li>
              <li>The Console has no Content-Security-Policy errors.</li>
              <li>With the network set to Offline, a tool still runs.</li>
            </ul>
            <p className={`text-xs leading-relaxed mt-4 ${body}`}>
              Clicking <span className={heading}>View on GitHub</span> in the footer does open github.com. That is you leaving on purpose, and the tool text stays here. The referrer policy tells the browser not to send this page&apos;s address along with that click.
            </p>
            <p className={`text-xs leading-relaxed mt-3 ${body}`}>
              These checks describe the copy you loaded today. After a new deploy, run them again. Start from the <Link to="/" className={darkMode ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-700'}>home page</Link>.
            </p>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
