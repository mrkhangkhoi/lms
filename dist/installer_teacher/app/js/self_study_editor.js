/**
 * CVALMS PRO - SELF-STUDY AUTHORING STUDIO (Editor)
 * Visual Form WYSIWYG, Markdown, Media Embeds, Assessment Builder & Cloud Sync
 */

class SelfStudyEditor {
  constructor(options = {}) {
    this.currentLesson = null;
    this.gatewayUrl = options.gatewayUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:49150');
  }

  normalizeLessonToSections(lesson) {
    if (!lesson || typeof lesson !== 'object') return null;
    const cloned = JSON.parse(JSON.stringify(lesson));

    if (Array.isArray(cloned.sections) && cloned.sections.length > 0) {
      return cloned;
    }

    const sections = [];
    if (cloned.step1_objectives) {
      sections.push({
        id: 'sec_1',
        type: 'objectives',
        title: cloned.step1_objectives.title || 'Mục Tiêu Bài Học & Yêu Cầu Cần Đạt',
        items: Array.isArray(cloned.step1_objectives.items) ? cloned.step1_objectives.items : []
      });
    }

    if (cloned.step2_theory) {
      sections.push({
        id: 'sec_2',
        type: 'theory',
        title: cloned.step2_theory.title || 'Khám Phá Kiến Thức Trọng Tâm (Theo SGK)',
        media: cloned.step2_theory.media || { type: 'none', url: '', caption: '' },
        sections: Array.isArray(cloned.step2_theory.sections) ? cloned.step2_theory.sections : []
      });
    }

    if (cloned.step3_notebook) {
      sections.push({
        id: 'sec_3',
        type: 'notebook',
        title: cloned.step3_notebook.title || 'Kiến Thức Cốt Lõi Em Ghi Vào Vở',
        points: Array.isArray(cloned.step3_notebook.points) ? cloned.step3_notebook.points : []
      });
    }

    if (cloned.step4_practice) {
      sections.push({
        id: 'sec_4',
        type: 'practice',
        title: cloned.step4_practice.title || 'Thử Thách Luyện Tập & Chốt Kiến Thức',
        cloze: cloned.step4_practice.cloze || null,
        quizzes: Array.isArray(cloned.step4_practice.quizzes) ? cloned.step4_practice.quizzes : []
      });
    }

    cloned.sections = sections;
    return cloned;
  }

  createNewLesson(id, grade = 6) {
    this.currentLesson = {
      id: id || `tin${grade}_bai_${Date.now()}`,
      grade: Number(grade),
      unit: `Chủ đề mới (Khối ${grade})`,
      title: 'Tên bài học mới',
      duration: '35 phút',
      step1_objectives: {
        title: 'Mục Tiêu Bài Học & Yêu Cầu Cần Đạt',
        items: [
          'Học sinh nêu được khái niệm cơ bản của bài học.',
          'Thực hành được thao tác chuẩn trên máy tính.'
        ]
      },
      step2_theory: {
        title: 'Khám Phá Kiến Thức Trọng Tâm (Theo SGK)',
        media: {
          type: 'none',
          url: '',
          caption: ''
        },
        sections: [
          {
            heading: '1. Nội dung trọng tâm',
            content: 'Nội dung kiến thức bài học được soạn tại đây bằng Markdown hoặc văn bản thuần túy.'
          }
        ]
      },
      step3_notebook: {
        title: 'Kiến Thức Cốt Lõi Em Ghi Vào Vở',
        points: [
          '1. Điểm cốt lõi thứ nhất cần ghi nhớ.',
          '2. Điểm cốt lõi thứ hai cần ghi nhớ.'
        ]
      },
      step4_practice: {
        title: 'Thử Thách Luyện Tập & Chốt Kiến Thức',
        cloze: null,
        quizzes: []
      }
    };
    return this.currentLesson;
  }

  loadLesson(lessonData) {
    if (!lessonData || typeof lessonData !== 'object') {
      throw new Error('Dữ liệu bài học không hợp lệ');
    }
    this.currentLesson = this.normalizeLessonToSections(lessonData);
    return this.currentLesson;
  }

  addSection(type = 'theory', title = '', props = {}) {
    if (!this.currentLesson) return null;
    if (!Array.isArray(this.currentLesson.sections)) {
      this.currentLesson.sections = [];
    }

    const secId = `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    let newSec = null;

    if (type === 'objectives') {
      newSec = {
        id: secId,
        type: 'objectives',
        title: title || 'Mục Tiêu Cần Đạt',
        items: Array.isArray(props.items) ? props.items : ['Mục tiêu cần đạt mới...']
      };
    } else if (type === 'theory') {
      newSec = {
        id: secId,
        type: 'theory',
        title: title || 'Nội Dung Bài Giảng',
        media: props.media || { type: 'none', url: '', caption: '' },
        sections: Array.isArray(props.sections) ? props.sections : [{ heading: 'Nội dung bài học', content: '' }]
      };
    } else if (type === 'notebook') {
      newSec = {
        id: secId,
        type: 'notebook',
        title: title || 'Kiến Thức Cốt Lõi Em Ghi Vào Vở',
        points: Array.isArray(props.points) ? props.points : ['Ghi nhớ quan trọng...']
      };
    } else if (type === 'quiz') {
      newSec = {
        id: secId,
        type: 'quiz',
        title: title || 'Luyện Tập Trắc Nghiệm',
        quizzes: Array.isArray(props.quizzes) ? props.quizzes : []
      };
    } else {
      newSec = {
        id: secId,
        type: 'practice',
        title: title || 'Thử Thách Luyện Tập',
        cloze: props.cloze || null,
        quizzes: Array.isArray(props.quizzes) ? props.quizzes : []
      };
    }

    this.currentLesson.sections.push(newSec);
    return newSec;
  }

  removeSection(index) {
    if (!this.currentLesson?.sections) return;
    if (index >= 0 && index < this.currentLesson.sections.length) {
      this.currentLesson.sections.splice(index, 1);
    }
  }

  moveSection(index, direction) {
    if (!this.currentLesson?.sections) return;
    const len = this.currentLesson.sections.length;
    if (direction === 'up' && index > 0) {
      const temp = this.currentLesson.sections[index];
      this.currentLesson.sections[index] = this.currentLesson.sections[index - 1];
      this.currentLesson.sections[index - 1] = temp;
    } else if (direction === 'down' && index < len - 1) {
      const temp = this.currentLesson.sections[index];
      this.currentLesson.sections[index] = this.currentLesson.sections[index + 1];
      this.currentLesson.sections[index + 1] = temp;
    }
  }

  addQuizQuestion(quiz) {
    if (!this.currentLesson) return;
    if (!this.currentLesson.step4_practice) {
      this.currentLesson.step4_practice = { title: 'Thử Thách Luyện Tập & Chốt Kiến Thức', quizzes: [] };
    }
    if (!Array.isArray(this.currentLesson.step4_practice.quizzes)) {
      this.currentLesson.step4_practice.quizzes = [];
    }

    const newQuiz = {
      type: quiz.type || 'single_choice',
      question: quiz.question || 'Câu hỏi trắc nghiệm',
      image: quiz.image || '',
      options: Array.isArray(quiz.options) ? quiz.options : ['A', 'B', 'C', 'D'],
      correctIndex: typeof quiz.correctIndex === 'number' ? quiz.correctIndex : 0,
      explanation: quiz.explanation || 'Giải thích đáp án'
    };

    this.currentLesson.step4_practice.quizzes.push(newQuiz);
  }

  removeQuizQuestion(index) {
    if (!this.currentLesson?.step4_practice?.quizzes) return;
    this.currentLesson.step4_practice.quizzes.splice(index, 1);
  }

  setClozeChallenge(text, blank, options, explanation) {
    if (!this.currentLesson) return;
    if (!this.currentLesson.step4_practice) {
      this.currentLesson.step4_practice = { title: 'Thử Thách Luyện Tập & Chốt Kiến Thức', quizzes: [] };
    }
    this.currentLesson.step4_practice.cloze = {
      text: String(text || ''),
      blank: String(blank || ''),
      options: Array.isArray(options) ? options : [blank],
      explanation: String(explanation || 'Chính xác!')
    };
  }

  exportToJson() {
    if (!this.currentLesson) return '{}';
    return JSON.stringify(this.currentLesson, null, 2);
  }

  importFromJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.id || !parsed.grade) {
        throw new Error('Thiếu trường id hoặc grade bắt buộc trong bài học');
      }
      this.currentLesson = parsed;
      return this.currentLesson;
    } catch (e) {
      throw new Error(`Lỗi phân tích JSON: ${e.message}`);
    }
  }

  buildGitHubCommitPayload(lessonId, lessonData, commitMessage) {
    const jsonStr = typeof lessonData === 'string' ? lessonData : JSON.stringify(lessonData, null, 2);
    let base64Content = '';
    if (typeof Buffer !== 'undefined') {
      base64Content = Buffer.from(jsonStr, 'utf8').toString('base64');
    } else if (typeof btoa !== 'undefined') {
      base64Content = btoa(unescape(encodeURIComponent(jsonStr)));
    }

    return {
      message: commitMessage || `Update lesson: ${lessonId}`,
      content: base64Content,
      branch: 'main'
    };
  }

  async saveToGateway(gatewayUrl) {
    const targetUrl = gatewayUrl || this.gatewayUrl;
    if (!this.currentLesson) throw new Error('Không có bài học để lưu');
    
    if (typeof fetch === 'undefined') {
      throw new Error('Môi trường không hỗ trợ fetch');
    }

    const res = await fetch(`${targetUrl}/api/self-study/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson: this.currentLesson })
    });

    if (!res.ok) {
      throw new Error(`Máy chủ từ chối: HTTP ${res.status}`);
    }

    return await res.json();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SelfStudyEditor;
}
if (typeof window !== 'undefined') {
  window.SelfStudyEditor = SelfStudyEditor;
}
