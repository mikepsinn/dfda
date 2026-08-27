import { emailer } from "@/lib/email"

import { submitContactForm } from "@/app/(frontpage)/contact-us/actions"

jest.mock("@/lib/email", () => ({
  emailer: {
    send: jest.fn(),
  },
}))

const sendEmail = emailer.send as jest.MockedFunction<typeof emailer.send>

function validFormData() {
  const formData = new FormData()
  formData.set("firstName", "Ada")
  formData.set("lastName", "Lovelace")
  formData.set("email", "ada@example.com")
  formData.set("subject", "Research question")
  formData.set("message", "I would like to learn more about your research.")
  return formData
}

describe("submitContactForm", () => {
  beforeEach(() => {
    sendEmail.mockReset()
  })

  it("rejects invalid form data before sending email", async () => {
    const result = await submitContactForm({}, new FormData())

    expect(result).toEqual({
      error: "Invalid form data. Please check your inputs.",
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("reports a delivery failure when the support notification fails", async () => {
    sendEmail.mockResolvedValueOnce({
      id: "",
      to: "support@dfda.earth",
      subject: "Research question",
      status: "failed",
      error: {
        code: "DOMAIN_NOT_VERIFIED",
        message: "Sender is not verified",
        solution: "Use a verified sender",
      },
    })

    const result = await submitContactForm({}, validFormData())

    expect(result).toEqual({
      error:
        "We couldn't send your message. Please try again or email support@dfda.earth directly.",
    })
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it("uses the visitor's address as reply-to and confirms delivery", async () => {
    sendEmail
      .mockResolvedValueOnce({
        id: "notification-id",
        to: "support@dfda.earth",
        subject: "Research question",
        status: "sent",
      })
      .mockResolvedValueOnce({
        id: "auto-reply-id",
        to: "ada@example.com",
        subject: "Thank you",
        status: "sent",
      })

    const result = await submitContactForm({}, validFormData())

    expect(sendEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: "support@dfda.earth",
        replyTo: "ada@example.com",
      })
    )
    expect(result).toEqual({
      success: true,
      message: "Thank you for your message. We will get back to you soon!",
    })
  })

  it("keeps the successful submission when only the auto-reply fails", async () => {
    sendEmail
      .mockResolvedValueOnce({
        id: "notification-id",
        to: "support@dfda.earth",
        subject: "Research question",
        status: "sent",
      })
      .mockResolvedValueOnce({
        id: "",
        to: "ada@example.com",
        subject: "Thank you",
        status: "failed",
        error: {
          code: "UNKNOWN_ERROR",
          message: "Auto-reply failed",
          solution: "Try again",
        },
      })

    const result = await submitContactForm({}, validFormData())

    expect(result.success).toBe(true)
    expect(sendEmail).toHaveBeenCalledTimes(2)
  })
})
