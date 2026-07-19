"use client";

import React from "react";
import LeadDetails from "@/components/leads/LeadDetails";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LeadDetailPage({ params }: PageProps) {
  const { id } = React.use(params);
  return <LeadDetails id={id} />;
}
