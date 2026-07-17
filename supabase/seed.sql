-- ============================================================
-- ChapterAI — Seed Data
-- Inserts sample projects, chapters, messages, references.
-- Run AFTER 00001_initial_schema.sql.
-- ============================================================

SET session_replication_role = 'replica';

-- ── Project 1: Quantitative (Social Media & Academic Performance) ──

INSERT INTO "project" ("id", "title", "topic", "academic_level", "department", "institution", "country", "methodology", "citation_style", "created_at", "updated_at")
VALUES (
  'p_sample_001',
  'Impact of Social Media on Student Academic Performance',
  'The Impact of Social Media Usage on the Academic Performance of Undergraduate Students in Nigerian Universities',
  'UNDERGRADUATE',
  'Computer Science',
  'University of Lagos',
  'Nigeria',
  'QUANTITATIVE',
  'APA',
  '2026-06-01T10:00:00Z',
  '2026-06-15T14:30:00Z'
);

INSERT INTO "chapter" ("id", "project_id", "chapter_number", "title", "content", "status", "created_at", "updated_at") VALUES
  ('ch_sample_001_1', 'p_sample_001', 1, 'Introduction',
   'Social media has become an integral part of daily life for university students. Platforms such as Facebook, Twitter, Instagram, and TikTok command significant portions of students'' time and attention. This study examines the relationship between social media usage patterns and academic performance among undergraduate students at the University of Lagos.

The proliferation of mobile devices and affordable data plans has made social media access ubiquitous on Nigerian campuses. While these platforms offer educational benefits including information sharing and collaborative learning, concerns have been raised about their potential negative impact on academic outcomes.

This research adopts a quantitative approach to measure the correlation between time spent on social media and cumulative grade point average (CGPA). A sample of 200 undergraduate students will be surveyed using a structured questionnaire.',
   'COMPLETE', '2026-06-05T08:00:00Z', '2026-06-05T08:00:00Z'),

  ('ch_sample_001_2', 'p_sample_001', 2, 'Literature Review',
   'The relationship between social media usage and academic performance has been extensively studied in recent years. Junco (2012) found that time spent on Facebook was negatively correlated with GPA among US college students. Similarly, Kirschner and Karpinski (2010) reported that Facebook users had lower GPAs and spent fewer hours studying compared to non-users.

However, other studies present a more nuanced picture. A study by Tess (2013) suggested that the educational use of social media can enhance student engagement and learning outcomes when properly integrated into pedagogical strategies. In the Nigerian context, Adeyinka and Mutula (2019) found that while social media distracted students, it also served as a platform for academic discussion and resource sharing.

The theoretical framework for this study is grounded in the Uses and Gratifications Theory (Katz et al., 1973), which posits that individuals actively select media to satisfy specific needs. This framework helps explain why students choose social media over academic activities and how they derive gratification from these platforms.',
   'COMPLETE', '2026-06-07T10:00:00Z', '2026-06-07T10:00:00Z'),

  ('ch_sample_001_3', 'p_sample_001', 3, 'Methodology',
   'This study employs a quantitative research design using a cross-sectional survey approach. The target population comprises all undergraduate students enrolled at the University of Lagos for the 2025/2026 academic session.

A stratified random sampling technique was used to select 200 participants from five faculties: Sciences, Social Sciences, Engineering, Arts, and Business Administration. Data was collected using a structured questionnaire comprising three sections: demographic information, social media usage patterns, and self-reported academic performance.

The questionnaire was validated through content validity and pilot tested with 30 students. Reliability was established using Cronbach''s alpha with a coefficient of 0.87. Data analysis employed descriptive statistics, Pearson correlation, and multiple regression analysis using SPSS version 27.',
   'COMPLETE', '2026-06-09T09:00:00Z', '2026-06-09T09:00:00Z'),

  ('ch_sample_001_4', 'p_sample_001', 4, 'Data Analysis',
   'This chapter presents the analysis of data collected from 200 undergraduate students.

Descriptive statistics revealed that 85% of respondents use social media daily, with an average daily usage of 3.5 hours (SD = 1.8). WhatsApp (92%), Instagram (78%), and Twitter (65%) were the most frequently used platforms.

Pearson correlation analysis showed a significant negative relationship between daily social media usage and CGPA (r = -0.42, p < 0.001). Multiple regression analysis indicated that social media usage (beta = -0.35, t = 4.82, p < 0.001) and time spent studying (beta = 0.41, t = 5.12, p < 0.001) were significant predictors of academic performance, accounting for 38% of the variance in CGPA (R² = 0.38, F(3, 196) = 21.45, p < 0.001).

An independent samples t-test revealed a significant difference in CGPA between heavy users (>3 hours/day, M = 2.85, SD = 0.52) and light users (<3 hours/day, M = 3.42, SD = 0.48; t(198) = 7.23, p < 0.001).',
   'COMPLETE', '2026-06-11T11:00:00Z', '2026-06-11T11:00:00Z'),

  ('ch_sample_001_5', 'p_sample_001', 5, 'Summary and Conclusion',
   'This study investigated the impact of social media usage on the academic performance of undergraduate students at the University of Lagos. The findings confirm a significant negative relationship between time spent on social media and academic performance.

The key findings indicate that: (1) 85% of students use social media daily with an average of 3.5 hours per day; (2) there is a moderate negative correlation between social media usage and CGPA (r = -0.42); (3) heavy users have significantly lower GPAs than light users; and (4) social media usage and study time are significant predictors of academic performance.

Based on these findings, the study recommends that universities implement awareness programs about the potential academic consequences of excessive social media use. Additionally, academic advisors should counsel students on effective time management strategies that balance social media engagement with academic responsibilities.

This study contributes to the growing body of literature on social media and academic performance within the Nigerian higher education context. Future research should explore qualitative aspects of social media use and examine discipline-specific variations in its impact.',
   'COMPLETE', '2026-06-13T08:00:00Z', '2026-06-13T08:00:00Z');

INSERT INTO "message" ("id", "project_id", "chapter_number", "role", "content", "created_at") VALUES
  ('msg_sample_001_1', 'p_sample_001', 1, 'user',     'Help me write the introduction for my research on social media and academic performance.', '2026-06-04T08:00:00Z'),
  ('msg_sample_001_2', 'p_sample_001', 1, 'assistant', 'I''ll help you write Chapter 1 (Introduction). Let me start with the background of the study, problem statement, and research objectives for your research on the impact of social media on academic performance.',                                                                                                                                          '2026-06-04T08:01:00Z');

INSERT INTO "reference" ("id", "project_id", "citation", "style", "source", "created_at") VALUES
  ('ref_sample_001_1', 'p_sample_001', 'Junco, R. (2012). The relationship between frequency of Facebook use, participation in Facebook activities, and student engagement. Computers & Education, 58(1), 162-171.',                                                                                                                                                                           'APA', 'generated', '2026-06-15T10:00:00Z'),
  ('ref_sample_001_2', 'p_sample_001', 'Kirschner, P. A., & Karpinski, A. C. (2010). Facebook and academic performance. Computers in Human Behavior, 26(6), 1237-1245.',                                                                                                                                                                                                                     'APA', 'generated', '2026-06-15T10:00:00Z'),
  ('ref_sample_001_3', 'p_sample_001', 'Tess, P. A. (2013). The role of social media in higher education classes. Computers & Education, 62, 146-162.',                                                                                                                                                                                                                                         'APA', 'generated', '2026-06-15T10:00:00Z'),
  ('ref_sample_001_4', 'p_sample_001', 'Adeyinka, T., & Mutula, S. (2019). Social media and academic performance: A study of Nigerian universities. Journal of Information Science, 45(3), 345-358.',                                                                                                                                                                                          'APA', 'generated', '2026-06-15T10:00:00Z'),
  ('ref_sample_001_5', 'p_sample_001', 'Katz, E., Blumler, J. G., & Gurevitch, M. (1973). Uses and gratifications research. Public Opinion Quarterly, 37(4), 509-523.',                                                                                                                                                                                                                      'APA', 'generated', '2026-06-15T10:00:00Z');

-- ── Project 2: Qualitative (Teacher Perceptions of AI) ──

INSERT INTO "project" ("id", "title", "topic", "academic_level", "department", "institution", "country", "methodology", "citation_style", "created_at", "updated_at")
VALUES (
  'p_sample_002',
  'Teacher Perceptions of AI in Education',
  'Exploring Teacher Perceptions of Artificial Intelligence Integration in Secondary School Classrooms',
  'MASTERS',
  'Education',
  'University of Cape Town',
  'South Africa',
  'QUALITATIVE',
  'APA',
  '2026-06-10T09:00:00Z',
  '2026-06-12T16:00:00Z'
);

INSERT INTO "chapter" ("id", "project_id", "chapter_number", "title", "content", "status", "created_at", "updated_at") VALUES
  ('ch_sample_002_1', 'p_sample_002', 1, 'Introduction',
   'Artificial intelligence (AI) is transforming educational landscapes globally. From intelligent tutoring systems to automated assessment tools, AI technologies are increasingly being adopted in classrooms. However, the successful integration of AI in education depends heavily on teachers'' perceptions and readiness to embrace these technologies.

This study explores the perceptions of secondary school teachers regarding the integration of AI tools in their teaching practices. Using a qualitative phenomenological approach, this research seeks to understand the lived experiences, concerns, and expectations of teachers as they navigate the adoption of AI in their classrooms.',
   'COMPLETE', '2026-06-12T08:00:00Z', '2026-06-12T08:00:00Z'),

  ('ch_sample_002_2', 'p_sample_002', 2, 'Literature Review',
   'The integration of AI in education has been a topic of growing scholarly interest. Holmes et al. (2019) provide a comprehensive overview of AI applications in education, including personalized learning systems, intelligent tutoring, and learning analytics. Their work emphasizes the potential of AI to address individual student needs and enhance learning outcomes.

Ertmer and Ottenbreit-Leftwich (2010) argue that teacher beliefs and attitudes are critical determinants of technology integration in classrooms. Their research suggests that even when infrastructure is adequate, teachers'' pedagogical beliefs significantly influence whether and how technology is adopted.

The Technology Acceptance Model (TAM), proposed by Davis (1989), provides the theoretical framework for this study. TAM posits that perceived usefulness and perceived ease of use are the primary determinants of technology acceptance.',
   'DRAFT', '2026-06-12T10:00:00Z', '2026-06-12T10:00:00Z'),

  ('ch_sample_002_3', 'p_sample_002', 3, 'Methodology',
   'This study adopts a qualitative phenomenological research design. The aim is to explore the lived experiences of secondary school teachers regarding AI integration in their classrooms.

Participants were selected through purposive sampling. Twelve teachers from four secondary schools in the Cape Town metropolitan area participated in semi-structured interviews. Each interview lasted approximately 45-60 minutes and was conducted via video conferencing.

Interview questions explored teachers'' understanding of AI, their experiences with AI tools, perceived benefits and challenges, and their recommendations for successful AI integration. Data was analyzed using thematic analysis following Braun and Clarke''s (2006) six-phase framework.',
   'DRAFT', '2026-06-12T14:00:00Z', '2026-06-12T14:00:00Z');

INSERT INTO "message" ("id", "project_id", "chapter_number", "role", "content", "created_at") VALUES
  ('msg_sample_002_1', 'p_sample_002', 1, 'user',     'I want to research how teachers feel about AI in their classrooms.',                                                                                                                                                                           '2026-06-10T09:00:00Z'),
  ('msg_sample_002_2', 'p_sample_002', 1, 'assistant', 'Great topic! Let me help you develop a qualitative study exploring teacher perceptions of AI integration. I''ll start with Chapter 1 using a phenomenological approach.',                                                                      '2026-06-10T09:01:00Z');

INSERT INTO "reference" ("id", "project_id", "citation", "style", "source", "created_at") VALUES
  ('ref_sample_002_1', 'p_sample_002', 'Holmes, W., Bialik, M., & Fadel, C. (2019). Artificial intelligence in education: Promises and implications for teaching and learning. Center for Curriculum Redesign.',                                                                                            'APA', 'generated', '2026-06-12T15:00:00Z'),
  ('ref_sample_002_2', 'p_sample_002', 'Ertmer, P. A., & Ottenbreit-Leftwich, A. T. (2010). Teacher technology change: How knowledge, beliefs, and culture intersect. Journal of Research on Technology in Education, 42(3), 255-284.',                                                                    'APA', 'generated', '2026-06-12T15:00:00Z'),
  ('ref_sample_002_3', 'p_sample_002', 'Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. MIS Quarterly, 13(3), 319-340.',                                                                                                                 'APA', 'generated', '2026-06-12T15:00:00Z'),
  ('ref_sample_002_4', 'p_sample_002', 'Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. Qualitative Research in Psychology, 3(2), 77-101.',                                                                                                                                        'APA', 'generated', '2026-06-12T15:00:00Z');

SET session_replication_role = 'origin';
