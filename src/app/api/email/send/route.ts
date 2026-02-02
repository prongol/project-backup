/**
 * API Route: POST /api/email/send
 * Client-side email sending via API
 * 
 * This route allows client components to request email sending through the server
 * without importing nodemailer or other Node.js-only modules directly
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmailAction, EmailOptions } from '@/lib/emaila/emailActions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.to || !body.subject || !body.html) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: to, subject, html',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = Array.isArray(body.to) ? body.to : [body.to];
    
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid email format: ${email}`,
          },
          { status: 400 }
        );
      }
    }

    // Prepare email options
    const emailOptions: EmailOptions = {
      to: body.to,
      subject: body.subject,
      html: body.html,
      text: body.text,
      from: body.from,
      replyTo: body.replyTo,
      cc: body.cc,
      bcc: body.bcc,
    };

    // Send email using server action
    const result = await sendEmailAction(emailOptions);

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          messageId: result.messageId,
          message: 'Email sent successfully',
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
