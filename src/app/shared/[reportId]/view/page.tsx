import { ReportView } from '@/components/reports/report-view';

export default async function ReportViewPage(props: { params: Promise<{ reportId: string }> }) {
  const params = await props.params;
  return <ReportView reportId={params.reportId} />;
}
