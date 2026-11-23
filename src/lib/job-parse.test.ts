import { describe, expect, it } from 'vitest';
import { hasJobSummary, parseJobBasic, tidyJobSummary } from './job-parse';

const advert = `Software Engineer at Northwind Health
Location: Manchester (Hybrid)
Salary: £55,000 - £65,000 per year
Full-time, permanent

About the role
We are a small team building tools for clinics.

What you'll do
- Build and ship features in TypeScript and React across our booking product
- Design REST APIs with Node.js and PostgreSQL
- Review code and help us get good at testing

What we're looking for
• 3+ years building web applications in production
• Strong communication with non-technical colleagues
• Experience with AWS and Docker

Benefits
- 25 days holiday`;

describe('parseJobBasic', () => {
  const s = parseJobBasic(advert);
  it('reads the headline facts', () => {
    expect(s.title).toBe('Software Engineer');
    expect(s.company).toBe('Northwind Health');
    expect(s.location).toBe('Manchester (Hybrid)');
    expect(s.workMode).toBe('Hybrid');
    expect(s.contract).toBe('Full-time');
    expect(s.salary).toContain('£55,000');
    expect(s.salary).toContain('£65,000');
  });
  it('splits what you do from what they want', () => {
    expect(s.responsibilities).toHaveLength(3);
    expect(s.requirements).toHaveLength(3);
    expect(s.requirements[0]).toMatch(/^3\+ years/);
    expect(s.responsibilities.join(' ')).not.toContain('holiday');
  });
  it('finds named skills as whole words', () => {
    expect(s.skills).toEqual(expect.arrayContaining(['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker']));
    expect(s.skills).not.toContain('Go');
  });
  it('does not repeat the work mode in the location', () => {
    expect(tidyJobSummary(s).location).toBe('Manchester');
    expect(tidyJobSummary({ ...s, location: 'Remote', workMode: 'Remote' }).location).toBe('');
    expect(tidyJobSummary({ ...s, location: 'London', workMode: '' }).location).toBe('London');
  });
  it('knows when there is nothing worth showing', () => {
    expect(hasJobSummary(s)).toBe(true);
    expect(hasJobSummary(parseJobBasic(''))).toBe(false);
  });
});
