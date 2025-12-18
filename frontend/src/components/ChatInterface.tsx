'use client';
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    IconButton,
    InputAdornment,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import { useState } from 'react';
import axios from 'axios';
import { MessageSquare, MessagesSquare } from 'lucide-react';

type Message = {
    sender: 'bot' | 'user';
    content: string;
};

export default function ChatBot() {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', content: "👋 Hi! Let's tailor your resume.\n📄 Please upload your resume." }
    ]);
    const [step, setStep] = useState<'resume' | 'jd' | 'followup'>('resume');
    const [input, setInput] = useState('');
    const [resume, setResume] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const [suggestionsText, setSuggestionsText] = useState('');
    const [followupCount, setFollowupCount] = useState(0);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const uploadedFile = e.target.files[0];
            setFile(uploadedFile);

            setMessages((prev) => [
                ...prev,
                { sender: 'user', content: `📎 Uploaded: ${uploadedFile.name}` },
                { sender: 'bot', content: '✏️ Great! Now paste the job description.' }
            ]);

            setStep('jd');
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const createMessage = (sender: 'bot' | 'user', content: string): Message => ({ sender, content });
        const updatedMessages = [...messages, createMessage('user', input)];
        setMessages(updatedMessages);

        if (step === 'resume') {
            setResume(input);
            setStep('jd');
            setMessages([
                ...updatedMessages,
                { sender: 'bot', content: '✅ Got it. Now paste the job description.' }
            ]);
            setInput('');
            return;
        }

        if (step === 'jd') {
            if (!file) return;

            setMessages([
                ...updatedMessages,
                { sender: 'bot', content: '⏳ Analyzing resume...' }
            ]);
            setInput('');
            setLoading(true);

            const formData = new FormData();
            formData.append('resume_file', file);
            formData.append('job_description', input);

            try {
                const res = await axios.post('http://localhost:8000/analyze/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const { fit_score, missing_keywords, suggestions } = res.data;

                setSuggestionsText(suggestions);  // Store for follow-up questions
                setMessages(prev => [
                    ...prev,
                    { sender: 'bot', content: `⭐ Fit Score: ${fit_score}%` },
                    { sender: 'bot', content: `🔍 Missing Keywords: ${missing_keywords.join(', ') || 'None 🎉'}` },
                    { sender: 'bot', content: `🛠️ Suggestions:\n${suggestions}` },
                    { sender: 'bot', content: '💬 You can now ask up to 3 follow-up questions about these suggestions.' }
                ]);
                setStep('followup');
            } catch (err) {
                console.error(err);
                setMessages(prev => [
                    ...prev,
                    { sender: 'bot', content: '❌ Error analyzing the resume.' }
                ]);
            } finally {
                setLoading(false);
            }
            return;
        }

        if (step === 'followup') {
            if (followupCount >= 3) {
                setMessages(prev => [
                    ...prev,
                    createMessage('user', input),
                    createMessage('bot', '⚠️ You have reached the 3-question limit.')
                ]);
                setInput('');
                return;
            }

            setMessages([
                ...updatedMessages,
                { sender: 'bot', content: '✏️ Let me think...' }
            ]);
            setLoading(true);

            try {
                const res = await axios.post('http://localhost:8000/ask-followup', {
                    suggestions: suggestionsText,
                    question: input
                });

                const { answer } = res.data;

                setMessages(prev => [
                    ...prev.slice(0, -1), // Remove thinking message
                    { sender: 'bot', content: answer || '🤖 No response available.' }
                ]);
                setFollowupCount(prev => prev + 1);
            } catch (err) {
                console.error(err);
                setMessages(prev => [
                    ...prev,
                    { sender: 'bot', content: '❌ Could not fetch follow-up answer.' }
                ]);
            } finally {
                setLoading(false);
                setInput('');
            }
        }
    };


    const handleKeyPress = (e: any) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const refreshChat = () => {
        setMessages([
            { sender: 'bot', content: "👋 Hi! Let's tailor your resume.\n📄 Please upload your resume." }
        ]);
        setStep('resume');
        setInput('');
        setResume('');
        setFile(null);
        setLoading(false);
    };

    return (
        <Box
            sx={{
                maxWidth: 700,
                mx: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '90vh',
                background: '#f9f9f9',
                borderRadius: 2,
                boxShadow: 2,
            }}
        >

            <span className='flex flex-row gap-2'>
                <MessagesSquare color='#2196f3' />
                <Typography color='primary' variant="h5" fontWeight={600}>
                    Resume & JD Matcher
                </Typography>

            </span>

            <Button
                onClick={refreshChat}
                variant="outlined"
                size="small"
                sx={{
                    alignSelf: 'flex-end',
                    mb: 2,
                    textTransform: 'none',
                    borderColor: '#1976d2',
                    color: '#1976d2',
                    '&:hover': {
                        backgroundColor: '#e3f2fd',
                        borderColor: '#1565c0',
                    },
                }}
            >
                🔄 Refresh
            </Button>

            <Box
                sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    background: '#FFFFFF',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(33, 150, 243, 0.1)',
                    overflowY: 'auto',
                    mb: 2,
                }}
            >
                {messages.map((msg, idx) => (
                    <ChatBubble key={idx} sender={msg.sender} content={msg.content} />
                ))}

                {/* File upload chat bubble (only during resume step) */}
                {step === 'resume' && (
                    <Box display="flex" justifyContent="flex-end" mt={1}>
                        <Box
                            sx={{
                                p: 1.5,
                                background: '#bbdefb',
                                color: '#0d47a1',
                                borderRadius: '12px 12px 12px 0',
                                maxWidth: '80%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                            }}
                        >
                            <Typography variant="body2">📄 Upload your resume</Typography>
                            <label htmlFor="upload-resume">
                                <Button variant="contained" size="small" component="span">
                                    Upload
                                </Button>
                            </label>
                            <input
                                id="upload-resume"
                                type="file"
                                accept=".pdf,.docx,.txt"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </Box>
                    </Box>
                )}

                {loading && <ChatBubble sender="bot" content={<CircularProgress size={20} />} />}
            </Box>

            <TextField
                multiline
                minRows={2}
                placeholder="Type your response..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={handleSend} disabled={loading}>
                                <SendIcon style={{ color: '#1976d2' }} />
                            </IconButton>
                        </InputAdornment>
                    ),
                    style: {
                        background: '#ffffff',
                        borderRadius: '8px',
                    },
                }}
                sx={{
                    background: '#e3f2fd',
                    borderRadius: 2,
                    boxShadow: '0 2px 6px rgba(33, 150, 243, 0.2)',
                }}
            />
        </Box>
    );
}

function ChatBubble({ sender, content }: { sender: 'bot' | 'user'; content: any }) {
    const isBot = sender === 'bot';

    return (
        <Box mb={1.5}>
            <Box
                display="flex"
                alignItems="flex-start"
                gap={1}
                flexDirection={isBot ? 'row' : 'row-reverse'}
            >
                <Avatar sx={{ bgcolor: isBot ? '#1976d2' : '#1e88e5' }}>
                    {isBot ? <SmartToyIcon /> : <PersonIcon />}
                </Avatar>
                <Paper
                    elevation={1}
                    sx={{
                        p: 1.5,
                        background: isBot ? '#bbdefb' : '#90caf9',
                        color: '#0d47a1',
                        borderRadius: isBot ? '12px 12px 12px 0' : '12px 12px 0 12px',
                        whiteSpace: 'pre-wrap',
                        maxWidth: '80%',
                    }}
                >
                    <Typography variant="body2">{content}</Typography>
                </Paper>
            </Box>
        </Box>
    );
}