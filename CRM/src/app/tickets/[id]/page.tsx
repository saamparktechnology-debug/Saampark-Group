"use client";

import React from "react";
import TicketDetails from "@/components/tickets/TicketDetails";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = React.use(params);
  return <TicketDetails id={Number(id)} />;
}
