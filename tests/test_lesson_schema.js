// tests/test_lesson_schema.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const LESSONS_DIR = path.join(ROOT_DIR, 'lessons');
const MANIFEST_PATH = path.join(LESSONS_DIR, 'manifest.json');

console.log('[TEST] Checking Manifest and Lesson Schemas...');

// 1. Check Manifest
assert.ok(fs.existsSync(MANIFEST_PATH), 'manifest.json must exist in lessons/');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
assert.ok(Array.isArray(manifest.grades), 'manifest.grades must be an array');
assert.ok(manifest.grades.length >= 4, 'manifest must cover at least 4 grades (6, 7, 8, 9)');

manifest.grades.forEach(gradeObj => {
  assert.ok(gradeObj.grade, 'gradeObj must have grade');
  assert.ok(Array.isArray(gradeObj.lessons), `grade ${gradeObj.grade} must have lessons array`);
});

// 2. Validate individual lesson files listed in manifest
let checkedCount = 0;
manifest.grades.forEach(gradeObj => {
  gradeObj.lessons.forEach(lessonRef => {
    const lessonPath = path.join(LESSONS_DIR, lessonRef.file);
    assert.ok(fs.existsSync(lessonPath), `Lesson file not found: ${lessonRef.file}`);
    const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));

    // Check basic metadata
    assert.strictEqual(lesson.id, lessonRef.id, `Lesson id mismatch in ${lessonRef.file}`);
    assert.ok(lesson.title, `Missing title in ${lessonRef.file}`);
    assert.ok(lesson.unit, `Missing unit in ${lessonRef.file}`);
    assert.ok(lesson.grade, `Missing grade in ${lessonRef.file}`);

    // Check Step 1: Objectives
    assert.ok(lesson.step1_objectives, `Missing step1_objectives in ${lessonRef.file}`);
    assert.ok(Array.isArray(lesson.step1_objectives.items) && lesson.step1_objectives.items.length > 0, 
      `step1_objectives.items must be non-empty array in ${lessonRef.file}`);

    // Check Step 2: Theory
    assert.ok(lesson.step2_theory, `Missing step2_theory in ${lessonRef.file}`);
    assert.ok(Array.isArray(lesson.step2_theory.sections) && lesson.step2_theory.sections.length > 0, 
      `step2_theory.sections must be non-empty array in ${lessonRef.file}`);
    lesson.step2_theory.sections.forEach(s => {
      assert.ok(s.heading, `section heading missing in ${lessonRef.file}`);
      assert.ok(s.content, `section content missing in ${lessonRef.file}`);
    });

    // Check Step 3: Notebook
    assert.ok(lesson.step3_notebook, `Missing step3_notebook in ${lessonRef.file}`);
    assert.ok(Array.isArray(lesson.step3_notebook.points) && lesson.step3_notebook.points.length > 0, 
      `step3_notebook.points must be non-empty array in ${lessonRef.file}`);

    // Check Step 4: Practice
    assert.ok(lesson.step4_practice, `Missing step4_practice in ${lessonRef.file}`);
    assert.ok(Array.isArray(lesson.step4_practice.quizzes) && lesson.step4_practice.quizzes.length > 0, 
      `step4_practice.quizzes must be non-empty array in ${lessonRef.file}`);
    lesson.step4_practice.quizzes.forEach(q => {
      assert.ok(q.question, `Quiz missing question in ${lessonRef.file}`);
      assert.ok(Array.isArray(q.options) && q.options.length >= 2, `Quiz options invalid in ${lessonRef.file}`);
      assert.strictEqual(typeof q.correctIndex, 'number', `Quiz correctIndex must be number in ${lessonRef.file}`);
      assert.ok(q.explanation, `Quiz missing explanation in ${lessonRef.file}`);
    });

    checkedCount++;
  });
});

assert.ok(checkedCount >= 2, 'Must check at least 2 sample lesson files');
console.log(`[PASS] Verified manifest and ${checkedCount} lesson schemas successfully.`);
