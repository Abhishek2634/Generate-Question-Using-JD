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
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import {
  startNewInterview,
  updateCurrentAnswer,
  nextQuestion,
  setTimer,
  completeInterview,
  resetCurrentSession,
  type Candidate,
} from "@/lib/redux/interviewSlice";
import {
  getAIScoreAndSummary,
  generateInterviewQuestions,
} from "@/lib/services/aiService";
import WelcomeBackModal from "./WelcomeBackModal";

const { Dragger } = Upload;
const { TextArea } = Input;
const { Title, Text } = Typography;

export default function IntervieweeView() {
  const dispatch: AppDispatch = useDispatch();
  const { currentSession, candidates } = useSelector(
    (state: RootState) => state.interview
  );

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [userInfo, setUserInfo] = useState({ name: "", email: "", phone: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentCandidate = candidates.find(
    (c: Candidate) => c.id === currentSession?.candidateId
  );
  const question =
    currentSession?.questions?.[currentSession.currentQuestionIndex];

  // Handle case where session exists but questions are missing (old persisted data)
  useEffect(() => {
    if (
      currentSession &&
      currentSession.status === "in-progress" &&
      !currentSession.questions
    ) {
      console.log(
        "🔄 Session exists but questions missing, resetting session..."
      );
      dispatch(resetCurrentSession());
    }
  }, [currentSession, dispatch]);

  const timerValue =
    question && question.time > 0 && currentSession
      ? Math.round(
          ((question.time - currentSession.timer) / question.time) * 1000
        ) / 10 // 1 decimal place
      : 0;

  useEffect(() => {
    if (currentSession?.status === "in-progress" && currentSession.timer > 0) {
      timerRef.current = setInterval(() => {
        dispatch(setTimer(currentSession.timer - 1));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
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

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".pdf,.docx",
    maxCount: 1,
    beforeUpload: (file) => {
      // Validate file type
      const isValidType =
        file.type === "application/pdf" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (!isValidType) {
        message.error("You can only upload PDF or DOCX files!");
        return false;
      }

      // Validate file size (max 10MB)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error("File must be smaller than 10MB!");
        return false;
      }

      setResumeFile(file);
      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setResumeFile(null);
    },
    onDrop: (e) => {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  const handleUpload = async () => {
    if (!resumeFile) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", resumeFile);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse resume");
      }

      const parsedData = await response.json();

      // Check if any data was extracted
      if (parsedData.name || parsedData.email || parsedData.phone) {
        setUserInfo(parsedData);
        form.setFieldsValue(parsedData);
        message.success(
          "Resume parsed successfully! Please review and complete any missing fields."
        );
      } else {
        message.warning(
          "Resume uploaded but no information could be extracted. Please fill the form manually."
        );
      }
    } catch (error) {
      console.error("Resume parsing error:", error);
      message.error("Failed to parse resume. Please fill the form manually.");
    }
    setIsLoading(false);
  };

  const handleInfoSubmit = (values: {
    name: string;
    email: string;
    phone: string;
  }) => {
    // Validate that all required fields are filled
    if (!values.name || !values.email || !values.phone) {
      message.error(
        "Please fill in all required fields before starting the interview."
      );
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email)) {
      message.error("Please enter a valid email address.");
      return;
    }

    dispatch(startNewInterview(values));
    message.success("Interview started! Good luck!");
  };

  const handleNextQuestion = () => {
    if (!currentSession || !currentSession.questions) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const isLastQuestion =
      currentSession.currentQuestionIndex ===
      currentSession.questions.length - 1;

    if (isLastQuestion) {
      const answers = currentSession.questions.map((q, i) => ({
        question: q.text,
        answer: currentSession.answers[i] || "No answer provided.",
      }));
      const { finalScore, summary, detailedScores } =
        getAIScoreAndSummary(answers);
      dispatch(completeInterview({ finalScore, summary, detailedScores }));
      message.success("Interview completed! Thank you for your time.");
    } else {
      dispatch(nextQuestion());
    }
  };

  // Interview completed view
  if (currentSession?.status === "completed" && currentCandidate) {
    return (
      <Card
        title="🎉 Interview Complete!"
        style={{ maxWidth: 800, margin: "0 auto" }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Text strong>Thank you, {currentCandidate.name}!</Text>
          <div>
            <Text>Your final score: </Text>
            <Text strong style={{ fontSize: "24px", color: "#52c41a" }}>
              {currentCandidate.score}/100
            </Text>
          </div>
          <div>
            <Title level={4}>AI Summary:</Title>
            <Text>{currentCandidate.summary}</Text>
          </div>
          <Button
            type="primary"
            onClick={() => {
              dispatch(resetCurrentSession());
              window.location.reload();
            }}
            size="large"
          >
            Start New Interview
          </Button>
        </Space>
      </Card>
    );
  }

  // Interview in progress view
  if (
    currentSession?.status === "in-progress" &&
    question &&
    currentSession.questions
  ) {
    return (
      <>
        <WelcomeBackModal />
        <Card
          title={`Question ${currentSession.currentQuestionIndex + 1} of ${
            currentSession.questions.length
          }`}
          style={{ maxWidth: 800, margin: "0 auto" }}
          extra={<Text type="secondary">{question.difficulty}</Text>}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Progress
                percent={timerValue}
                strokeColor={{
                  "0%": "#ff4d4f", // Red when just started
                  "25%": "#faad14", // Orange
                  "50%": "#52c41a", // Green
                  "100%": "#1890ff", // Blue when complete
                }}
                status={currentSession.timer <= 10 ? "exception" : "active"}
                format={(percent) => `${Math.round(percent || 0)}%`} // Clean percentage format
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
                  Question {currentSession.currentQuestionIndex + 1} of{" "}
                  {currentSession.questions?.length || 0}
                </Text>
                <Text
                  style={{
                    color: currentSession.timer <= 10 ? "#ff4d4f" : "#666",
                  }}
                >
                  {currentSession.timer}s remaining
                </Text>
              </div>
            </div>
            <div>
              <Title level={4}>{question.text}</Title>
              <TextArea
                rows={8}
                value={
                  currentSession.answers[currentSession.currentQuestionIndex] ||
                  ""
                }
                onChange={(e) => dispatch(updateCurrentAnswer(e.target.value))}
                placeholder="Type your answer here..."
                style={{ marginTop: "16px" }}
              />
            </div>
            <Button
              type="primary"
              onClick={handleNextQuestion}
              size="large"
              block
            >
              {currentSession.currentQuestionIndex ===
              currentSession.questions.length - 1
                ? "Finish Interview"
                : "Next Question"}
            </Button>
          </Space>
        </Card>
      </>
    );
  }

  // Initial setup view
  return (
    <>
      <WelcomeBackModal />
      <Card
        title="Start Your Interview"
        style={{ maxWidth: 600, margin: "0 auto" }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={4}>Upload your Resume (Optional)</Title>
            <Text type="secondary">
              We will try to extract your information automatically
            </Text>
            <Dragger {...uploadProps} style={{ marginTop: "16px" }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag resume to this area
              </p>
              <p className="ant-upload-hint">Support PDF and DOCX files only</p>
            </Dragger>
            {resumeFile && (
              <Button
                type="primary"
                onClick={handleUpload}
                loading={isLoading}
                style={{ marginTop: "16px", width: "100%" }}
              >
                Parse Resume
              </Button>
            )}
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleInfoSubmit}
            initialValues={userInfo}
          >
            <Title level={4}>Personal Information</Title>
            <Form.Item
              label="Full Name"
              name="name"
              rules={[
                { required: true, message: "Please enter your name!" },
                { min: 2, message: "Name must be at least 2 characters long!" },
              ]}
            >
              <Input placeholder="Enter your full name" />
            </Form.Item>

            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: "Please enter your email!" },
                { type: "email", message: "Please enter a valid email!" },
                {
                  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email format!",
                },
              ]}
            >
              <Input placeholder="Enter your email address" type="email" />
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
              <Input placeholder="Enter your phone number" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block>
                Start Interview
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </>
  );
}
