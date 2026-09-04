import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      activeOpportunities: 6,
      totalApplicants: 42,
      shortlistedCount: 14,
      verifiedTalentPool: 120,
      skillsDemand: [
        { name: "Node.js", requiredAvg: 80, applicantsMeeting: "68%" },
        { name: "SQL", requiredAvg: 75, applicantsMeeting: "82%" },
        { name: "REST APIs", requiredAvg: 75, applicantsMeeting: "72%" },
        { name: "React.js", requiredAvg: 80, applicantsMeeting: "60%" },
      ],
    },
  })
}
