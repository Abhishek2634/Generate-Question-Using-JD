"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/lib/redux/store";
import {
  Card,
  Input,
  Button,
  Upload,
  Form,
  Progress,
  Typography,
  Space,
  message,
  Steps,
} from "antd";
import {
  InboxOutlined,
  FileTextOutlined,
  UserOutlined,
  CheckCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import {
  setJobDescription,
  setGeneratedQuestions,
  startNewInterview,
  updateCurrentAnswer,
  nextQuestion,
  setTimer,
  completeInterview,
  resetCurrentSession,
  type Candidate,
} from "@/lib/redux/interviewSlice";
import { getAIScoreAndSummary } from "@/lib/services/aiService";
import WelcomeBackModal from "./WelcomeBackModal";

const { Dragger } = Upload;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Step } = Steps;

export default function IntervieweeView() {
  const dispatch: AppDispatch = useDispatch();
  const { currentSession, candidates, generatedQuestions, pendingJobDescription } = useSelector(
    (state: RootState) => state.interview
  );

  // Step control and form state
  const [currentStep, setCurrentStep] = useState<'jd-input' | 'candidate-info' | 'interview'>('jd-input');
  const [jobDescriptionText, setJobDescriptionText] = useState(pendingJobDescription || '');
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Resume and candidate details
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | undefined>();
  const [userInfo, setUserInfo] = useState({ name: "", email: "", phone: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form] = Form.useForm();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentCandidate = candidates.find(
    (c: Candidate) => c.id === currentSession?.candidateId
  );
  const question = currentSession?.questions?.[currentSession.currentQuestionIndex];

  // Handle missing session questions
  useEffect(() => {
    if (
      currentSession &&
      currentSession.status === "in-progress" &&
      !currentSession.questions
    ) {
      dispatch(resetCurrentSession());
    }
  }, [currentSession, dispatch]);

  // Step transition logic
  useEffect(() => {
    if (currentSession?.status === "in-progress") {
      setCurrentStep("interview");
    } else if (generatedQuestions && generatedQuestions.length > 0) {
      setCurrentStep("candidate-info");
    }
  }, [currentSession, generatedQuestions]);

  // Progress bar logic
  const timerValue =
    question && question.time > 0 && currentSession
      ? Math.round(
          ((question.time - currentSession.timer) / question.time) * 1000
        ) / 10
      : 0;

  // Timer countdown
  useEffect(() => {
    if (currentSession?.status === "in-progress" && currentSession.timer > 0) {
      timerRef.current = setInterval(() => {
        dispatch(setTimer(currentSession.timer - 1));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentSession, dispatch]);

  useEffect(() => {
    if (
      currentSession &&
      currentSession.timer <= 0 &&
      currentSession.status === "in-progress"
    ) {
      handleNextQuestion();
    }
  }, [currentSession]);

  // JD generation handler
  const handleJDSubmit = async () => {
    if (jobDescriptionText.trim().length < 50) {
      message.error("Job description must be at least 50 characters long");
      return;
    }

    setGeneratingQuestions(true);
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch("/api/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription: jobDescriptionText }),
        });

        if (response.ok) {
          const data = await response.json();
          if (!data.questions || data.questions.length === 0) {
            throw new Error("No questions generated");
          }
          dispatch(setJobDescription(jobDescriptionText));
          dispatch(setGeneratedQuestions(data.questions));
          setCurrentStep("candidate-info");
          message.success(`Generated ${data.questions.length} questions successfully!`);
          setGeneratingQuestions(false);
          return;
        }

        const errorData = await response.json();
        if (response.status === 503 && attempt < maxRetries - 1) {
          message.warning(
            `API is busy, retrying... (Attempt ${attempt + 2}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
          continue;
        }
        throw new Error(errorData.error || "Failed to generate questions");
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
        }
      }
    }
    message.error(
      lastError?.message ||
        "Failed to generate questions after multiple attempts. Please try again later."
    );
    setGeneratingQuestions(false);
  };

  // Resume upload logic
  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".pdf,.docx",
    maxCount: 1,
    beforeUpload: (file) => {
      const isValidType =
        file.type === "application/pdf" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (!isValidType) {
        message.error("You can only upload PDF or DOCX files!");
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error("File must be smaller than 10MB!");
        return false;
      }
      setResumeFile(file);
      return false;
    },
    onRemove: () => {
      setResumeFile(null);
    },
  };

  const handleUpload = async () => {
    if (!resumeFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", resumeFile);
      const response = await fetch("/api/upload-resume", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Failed to upload file");
      const { url } = await response.json();
      setResumeUrl(url);
      message.success("Resume uploaded!");
    } catch {
      message.error("Upload failed.");
    }
    setIsUploading(false);
  };

  const handleInfoSubmit = (values: { name: string; email: string; phone: string }) => {
    if (!values.name || !values.email || !values.phone) {
      message.error("Please fill in all required fields before starting the interview.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email)) {
      message.error("Please enter a valid email address.");
      return;
    }
    if (!generatedQuestions || generatedQuestions.length === 0) {
      message.error("No questions available. Please generate questions first.");
      return;
    }
    dispatch(startNewInterview({ ...values, resumeUrl }));
    setCurrentStep("interview");
    message.success("Interview started! Good luck!");
  };

  const handleNextQuestion = () => {
    if (!currentSession || !currentSession.questions) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const isLastQuestion =
      currentSession.currentQuestionIndex === currentSession.questions.length - 1;

    if (isLastQuestion) {
      const answers = currentSession.questions.map((q, i) => ({
        question: q.text,
        answer: currentSession.answers[i] || "No answer provided.",
      }));
      const { finalScore, summary, detailedScores } = getAIScoreAndSummary(answers);
      dispatch(completeInterview({ finalScore, summary, detailedScores }));
      message.success("Interview completed! Thank you for your time.");
    } else {
      dispatch(nextQuestion());
    }
  };

  const handleStartNewInterview = () => {
    dispatch(resetCurrentSession());
    setCurrentStep("jd-input");
    setJobDescriptionText("");
    setResumeFile(null);
    setResumeUrl(undefined);
    setUserInfo({ name: "", email: "", phone: "" });
    form.resetFields();
  };

  if (currentSession?.status === "completed" && currentCandidate) {
    return (
      <Card
        title={
          <Space>
            <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "24px" }} />
            <span>Interview Complete!</span>
          </Space>
        }
        style={{ maxWidth: 800, margin: "0 auto" }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Title level={3}>Thank you, {currentCandidate.name}!</Title>
            <Text type="secondary">
              Your interview has been successfully submitted
            </Text>
          </div>
          <Card style={{ background: "#f0f2f5" }}>
            <div style={{ textAlign: "center" }}>
              <Text>Your final score</Text>
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "bold",
                  color:
                    currentCandidate.score >= 70
                      ? "#52c41a"
                      : "#faad14",
                  margin: "16px 0",
                }}
              >
                {currentCandidate.score}/100
              </div>
              {currentCandidate.score >= 80 && (
                <Text style={{ color: "#52c41a", fontSize: "18px" }}>
                  🌟 Excellent Performance!
                </Text>
              )}
              {currentCandidate.score >= 60 &&
                currentCandidate.score < 80 && (
                  <Text style={{ color: "#1890ff", fontSize: "18px" }}>
                    👍 Good Job!
                  </Text>
                )}
              {currentCandidate.score < 60 && (
                <Text style={{ color: "#faad14", fontSize: "18px" }}>
                  Keep Learning!
                </Text>
              )}
            </div>
          </Card>
          <div>
            <Title level={5}>AI Performance Summary</Title>
            <Card size="small">
              <Text>{currentCandidate.summary}</Text>
            </Card>
          </div>
          <Button
            type="primary"
            onClick={handleStartNewInterview}
            size="large"
            block
          >
            Start New Interview
          </Button>
        </Space>
      </Card>
    );
  }

  if (
    currentSession?.status === "in-progress" &&
    question &&
    currentSession.questions
  ) {
    return (
      <>
        <WelcomeBackModal />
        <Card
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                Question {currentSession.currentQuestionIndex + 1} of{" "}
                {currentSession.questions.length}
              </span>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                {question.category} • {question.difficulty}
              </Text>
            </div>
          }
          style={{ maxWidth: 900, margin: "0 auto" }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Progress
                percent={timerValue}
                strokeColor={{
                  "0%": "#ff4d4f",
                  "25%": "#faad14",
                  "50%": "#52c41a",
                  "100%": "#1890ff",
                }}
                status={currentSession.timer <= 10 ? "exception" : "active"}
                format={(percent) => `${Math.round(percent || 0)}%`}
                showInfo={true}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "8px",
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                <Text>
                  Progress: {currentSession.currentQuestionIndex + 1}/
                  {currentSession.questions?.length || 0}
                </Text>
                <Text
                  style={{
                    color:
                      currentSession.timer <= 10 ? "#ff4d4f" : "#666",
                    fontWeight:
                      currentSession.timer <= 10 ? "bold" : "normal",
                  }}
                >
                  ⏱️ {currentSession.timer}s remaining
                </Text>
              </div>
            </div>
            <div>
              <Title level={4} style={{ marginBottom: "16px" }}>
                {question.text}
              </Title>
              <TextArea
                rows={10}
                value={
                  currentSession.answers[currentSession.currentQuestionIndex] ||
                  ""
                }
                onChange={(e) =>
                  dispatch(updateCurrentAnswer(e.target.value))
                }
                placeholder="Type your answer here... Be clear and concise."
                style={{ fontSize: "15px" }}
                showCount
                maxLength={2000}
              />
              <Text
                type="secondary"
                style={{
                  fontSize: "12px",
                  marginTop: "8px",
                  display: "block",
                }}
              >
                💡 Tip: Include specific examples and technical details in your answer
              </Text>
            </div>
            <Button
              type="primary"
              onClick={handleNextQuestion}
              size="large"
              block
            >
              {currentSession.currentQuestionIndex ===
              currentSession.questions.length - 1
                ? "🎯 Finish Interview"
                : "➡️ Next Question"}
            </Button>
          </Space>
        </Card>
      </>
    );
  }

  // Step 1: Job Description Input
  if (currentStep === "jd-input") {
    return (
      <>
        <WelcomeBackModal />
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Steps current={0} style={{ marginBottom: "32px" }}>
            <Step title="Job Description" icon={<FileTextOutlined />} />
            <Step title="Your Information" icon={<UserOutlined />} />
            <Step title="Interview" icon={<CheckCircleOutlined />} />
          </Steps>
          <Card
            title={
              <Space>
                <FileTextOutlined
                  style={{ fontSize: "20px", color: "#1890ff" }}
                />
                <span>Step 1: Paste Job Description</span>
              </Space>
            }
          >
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Title level={4}>Job Description</Title>
                <Text type="secondary">
                  Paste the complete job description below. Our AI will analyze it and generate 7 tailored interview questions based on the role requirements.
                </Text>
                <TextArea
                  rows={15}
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                  placeholder="Paste the complete job description here (minimum 50 characters)..."
                  style={{ marginTop: "16px", fontSize: "14px" }}
                  showCount
                  maxLength={5000}
                />
                <Text
                  type="secondary"
                  style={{
                    fontSize: "12px",
                    marginTop: "8px",
                    display: "block",
                  }}
                >
                  📝 {jobDescriptionText.length < 50
                    ? `Need ${50 - jobDescriptionText.length} more characters`
                    : "✅ Ready to generate questions"}
                </Text>
              </div>
              <Button
                type="primary"
                size="large"
                block
                onClick={handleJDSubmit}
                loading={generatingQuestions}
                disabled={jobDescriptionText.trim().length < 50}
                icon={<CheckCircleOutlined />}
              >
                {generatingQuestions
                  ? "🤖 Generating Questions with AI..."
                  : "✨ Generate Interview Questions"}
              </Button>
            </Space>
          </Card>
        </div>
      </>
    );
  }

  // Step 2: Candidate Information
  return (
    <>
      <WelcomeBackModal />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Steps current={1} style={{ marginBottom: "32px" }}>
          <Step title="Job Description" icon={<CheckCircleOutlined />} status="finish" />
          <Step title="Your Information" icon={<UserOutlined />} />
          <Step title="Interview" icon={<CheckCircleOutlined />} />
        </Steps>
        <Card
          title={
            <Space>
              <UserOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
              <span>Step 2: Your Information</span>
            </Space>
          }
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {generatedQuestions && (
              <Card size="small" style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}>
                <Text style={{ color: "#52c41a" }}>
                  ✅ Successfully generated {generatedQuestions.length} interview questions!
                </Text>
              </Card>
            )}
            <div>
              <Title level={4}>Upload Resume (Optional)</Title>
              <Text type="secondary">
                We'll try to extract your information automatically
              </Text>
              <Dragger {...uploadProps} style={{ marginTop: "16px" }}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag resume to this area
                </p>
                <p className="ant-upload-hint">
                  Support PDF and DOCX files only (Max 10MB)
                </p>
              </Dragger>
              {resumeFile && (
                <Button
                  type="primary"
                  onClick={handleUpload}
                  loading={isUploading}
                  style={{ marginTop: "16px", width: "100%" }}
                >
                  {resumeUrl ? "✅ Uploaded" : "📄 Upload Resume"}
                </Button>
              )}
            </div>
            <Form form={form} layout="vertical" onFinish={handleInfoSubmit} initialValues={userInfo}>
              <Title level={4}>Personal Information</Title>
              <Form.Item
                label="Full Name"
                name="name"
                rules={[
                  { required: true, message: "Please enter your name!" },
                  { min: 2, message: "Name must be at least 2 characters long!" },
                ]}
              >
                <Input placeholder="Enter your full name" size="large" />
              </Form.Item>
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: "Please enter your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input placeholder="Enter your email address" type="email" size="large" />
              </Form.Item>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[
                  { required: true, message: "Please enter your phone number!" },
                  {
                    pattern: /^[\+]?[1-9][\d\s\-\(\)]{8,15}$/,
                    message: "Please enter a valid phone number!",
                  },
                ]}
              >
                <Input placeholder="Enter your phone number" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" block icon={<CheckCircleOutlined />}>
                  🚀 Start Interview ({generatedQuestions?.length || 0} Questions)
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </div>
    </>
  );
}
