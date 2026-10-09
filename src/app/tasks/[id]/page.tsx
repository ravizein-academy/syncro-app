import { TaskDetailForm } from "@/components/tasks/TaskDetailForm";

export function generateStaticParams() {
  return [
    { id: "t1" },
    { id: "t2" },
    { id: "t3" },
    { id: "t4" },
    { id: "t5" },
    { id: "t6" },
    { id: "t7" },
  ];
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TaskDetailForm taskId={id} />;
}
