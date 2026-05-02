import './globals.css';

export const metadata = {
  title: 'SkillXchange — Trade Skills, Not Money',
  description: 'A local skill exchange network where people trade skills instead of money. Teach Python, learn guitar. Design logos, get gym training. Build your community through skill sharing.',
  keywords: 'skill exchange, barter, learn, teach, community, local skills',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
