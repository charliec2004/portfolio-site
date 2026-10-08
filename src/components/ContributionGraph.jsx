import contributions from '../data/contributions.json';
import { renderContributionGraph } from '../lib/contributions';

export default function ContributionGraph() {
  return <div dangerouslySetInnerHTML={{ __html: renderContributionGraph(contributions) }} />;
}
