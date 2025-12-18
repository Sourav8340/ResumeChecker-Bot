import re
from nltk.corpus import stopwords
from nltk.tokenize import wordpunct_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ollama import chat
import nltk

nltk.download('stopwords')

def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)
    tokens = wordpunct_tokenize(text)
    tokens = [word for word in tokens if word not in stopwords.words('english')]
    return ' '.join(tokens)

def get_fit_score(resume, jd):
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([clean_text(resume), clean_text(jd)])
    score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    return round(score * 100, 2)

def find_missing_keywords(resume, jd):
    resume_tokens = set(clean_text(resume).split())
    jd_tokens = set(clean_text(jd).split())
    return sorted(jd_tokens - resume_tokens)

def get_suggestions_from_ollama(resume, jd):
    prompt = f"""
You are a resume expert. Given this resume and job description, suggest improvements:

Resume:
{resume}

Job Description:
{jd}

Your response should include:
- Which keywords or skills are missing in the resume
- What phrasing could be improved
- Any structural suggestions
"""

    response = chat(
        model='llama3.2:latest',  # Updated from 'llama3.2:1b' to valid model name
        messages=[{"role": "user", "content": prompt}]
    )

    return response["message"]["content"]

def ask_followup_from_ollama(suggestions, question):
    prompt = f"""
You previously gave the following resume suggestions:

{suggestions}

Now the user asks this follow-up question:
"{question}"

Please answer clearly based on your earlier suggestions.
"""

    response = chat(
        model='llama3.2:latest',  # Updated to llama3.2:latest
        messages=[{"role": "user", "content": prompt}]
    )

    return response["message"]["content"]