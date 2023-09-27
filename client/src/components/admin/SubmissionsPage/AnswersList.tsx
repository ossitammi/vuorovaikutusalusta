import {
  AnswerEntry,
  Submission,
  SurveyQuestion as Question,
  SurveyMapQuestion,
} from '@interfaces/survey';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { isAnswerEmpty } from '@src/stores/SurveyAnswerContext';
import { useTranslations } from '@src/stores/TranslationContext';
import React, { useMemo } from 'react';
import SurveyQuestion from '@src/components/SurveyQuestion';

interface Props {
  selectedQuestion: Question;
  selectedAnswer: AnswerSelection;
  setSelectedAnswer: (answer: AnswerSelection) => void;
  submissions: Submission[];
  surveyQuestions: Question[];
  surveyId: number;
  modifyAnswerCallback: () => void;
}

export interface AnswerSelection {
  submissionId: number;
  questionId: number;
  index: number;
}

interface AnswerItem {
  submission: Submission;
  entry: AnswerEntry & { index?: number };
}

function isMapEntry(
  entry: AnswerEntry,
): entry is AnswerEntry & { type: 'map' } {
  return entry.type === 'map';
}

function answerEntryToItems(
  submission: Submission,
  entry: AnswerEntry,
): AnswerItem[] {
  if (!isMapEntry(entry)) {
    return [{ submission, entry }];
  }
  return entry.value.map((value, index) => ({
    submission,
    entry: {
      sectionId: entry.sectionId,
      type: entry.type,
      value: [value],
      index,
    },
  }));
}

function isItemSelected(item: AnswerItem, selection: AnswerSelection) {
  return (
    selection &&
    item.submission.id === selection.submissionId &&
    item.entry.sectionId === selection.questionId &&
    item.entry.index === selection.index
  );
}

const useStyles = makeStyles({
  answerHeading: {
    alignItems: 'center',
  },
});

export default function AnswersList({
  selectedQuestion,
  selectedAnswer,
  setSelectedAnswer,
  submissions,
  surveyQuestions,
}: Props) {
  const classes = useStyles();
  const { tr } = useTranslations();

  /**
   * All answers flattened from all submissions
   */
  const allAnswers = useMemo(() => {
    return submissions.reduce(
      (answerEntries, submission) => [
        ...answerEntries,
        ...submission.answerEntries.reduce(
          (items, entry) => [
            ...items,
            ...answerEntryToItems(submission, entry),
          ],
          [] as AnswerItem[],
        ),
      ],
      [] as AnswerItem[],
    );
  }, [submissions]);
  /**
   * Currently visible answers
   */
  const answers = useMemo(() => {
    return selectedQuestion?.id === 0 || !selectedQuestion
      ? allAnswers
      : allAnswers.filter(
          (answer) =>
            answer.entry.sectionId === selectedQuestion.id &&
            !isAnswerEmpty(selectedQuestion, answer.entry.value),
        );
  }, [allAnswers, selectedQuestion]);

  return (
    <div>
      <Typography variant="h4" style={{ margin: '1rem' }}>
        {tr.AnswersList.answers}
      </Typography>
      {!selectedQuestion && (
        <Typography>{tr.AnswersList.selectQuestion}</Typography>
      )}
      {selectedQuestion && !answers.length && (
        <Typography>{tr.AnswersList.noAnswers}</Typography>
      )}
      {selectedQuestion &&
        answers.length > 0 &&
        answers.map((answer, index) => (
          <Accordion
            key={index}
            expanded={isItemSelected(answer, selectedAnswer)}
            TransitionProps={{
              onEntered: (node) =>
                node.scrollIntoView({ behavior: 'smooth', block: 'end' }),
            }}
            onChange={(_event, isExpanded) => {
              if (isExpanded) {
                setSelectedAnswer({
                  submissionId: answer.submission.id,
                  questionId: answer.entry.sectionId,
                  index: answer.entry.index,
                });
              } else if (isItemSelected(answer, selectedAnswer)) {
                setSelectedAnswer(null);
              }
            }}
          >
            <AccordionSummary classes={{ content: classes.answerHeading }}>
              <div style={{ flexGrow: 1 }}>
                {tr.AnswersList.answer} {answer.submission.id}/
                {answer.entry.sectionId}
                {answer.entry.index != null ? `/${answer.entry.index}` : ''}
              </div>
            </AccordionSummary>
            {isItemSelected(answer, selectedAnswer) && (
              <AccordionDetails>
                {answer.entry.type === 'map' ? (
                  <>
                    {(answer.entry as AnswerEntry & { type: 'map' }).value.map(
                      (item) =>
                        item.subQuestionAnswers.map(
                          (subquestionAnswer, index) => (
                            <SurveyQuestion
                              pageUnfinished={false}
                              mobileDrawerOpen={false}
                              key={index}
                              readOnly
                              question={(
                                surveyQuestions.find(
                                  (question) =>
                                    question.id === answer.entry.sectionId,
                                ) as SurveyMapQuestion
                              )?.subQuestions?.find(
                                (subQuestion) =>
                                  subQuestion.id ===
                                  subquestionAnswer.sectionId,
                              )}
                              value={subquestionAnswer.value}
                            />
                          ),
                        ),
                    )}
                  </>
                ) : (
                  <SurveyQuestion
                    readOnly
                    pageUnfinished={false}
                    mobileDrawerOpen={false}
                    question={
                      selectedQuestion?.id === 0
                        ? surveyQuestions.find(
                            (question) =>
                              question.id === answer.entry.sectionId,
                          )
                        : selectedQuestion
                    }
                    submission={answer.submission}
                    value={answer.entry.value}
                  />
                )}
              </AccordionDetails>
            )}
          </Accordion>
        ))}
    </div>
  );
}
