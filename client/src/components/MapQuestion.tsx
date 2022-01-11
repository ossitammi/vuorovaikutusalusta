import {
  MapQuestionAnswer,
  MapQuestionSelectionType,
  SurveyMapQuestion,
  SurveyMapSubQuestionAnswer,
} from '@interfaces/survey';
import {
  Badge,
  Button,
  FormHelperText,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@material-ui/core';
import { useSurveyMap } from '@src/stores/SurveyMapContext';
import { useTranslations } from '@src/stores/TranslationContext';
import React, { useEffect, useRef, useState } from 'react';
import AreaIcon from './icons/AreaIcon';
import LineIcon from './icons/LineIcon';
import PointIcon from './icons/PointIcon';
import MapSubQuestionDialog from './MapSubQuestionDialog';

interface Props {
  value: MapQuestionAnswer[];
  onChange: (value: MapQuestionAnswer[]) => void;
  question: SurveyMapQuestion;
  setDirty: (dirty: boolean) => void;
}

export default function MapQuestion({ value, onChange, question }: Props) {
  const [drawingCancelled, setDrawingCancelled] = useState(false);
  const drawingCancelledRef = useRef(drawingCancelled);
  const [selectionType, setSelectionType] =
    useState<MapQuestionSelectionType>(null);
  const [subQuestionDialogOpen, setSubQuestionDialogOpen] = useState(false);
  const [handleSubQuestionDialogClose, setHandleSubQuestionDialogClose] =
    useState<(answers: SurveyMapSubQuestionAnswer[]) => void>(null);
  const {
    draw,
    isMapReady,
    isMapActive,
    stopDrawing,
    questionId: drawingQuestionId,
  } = useSurveyMap();
  const { tr } = useTranslations();

  /**
   * Execute the drawing answer flow when user selects a selection type
   */
  useEffect(() => {
    if (!isMapReady) {
      // Selection type shouldn't change when it's disabled, i.e. map isn't ready yet
      return;
    }
    if (!selectionType) {
      stopDrawing(question.id);
      return;
    }

    setDrawingCancelled(false);
    async function handleMapDraw() {
      const geometry = await draw(selectionType, question.id, question.title);

      // The state variable isn't updated inside this async function - access its current value via ref
      if (drawingCancelledRef.current) {
        return;
      }

      // If no geometry was returned, either the mobile menu was closed or the step was skipped - ignore the question for now
      if (!geometry) {
        return;
      }

      const subQuestionAnswers = await getSubQuestionAnswers();

      if (!subQuestionAnswers) {
        // Subquestion dialog was cancelled - do not add an answer
        setSelectionType(null);
        return;
      }

      // Update the new answer to context at once
      onChange([
        ...value,
        {
          selectionType,
          geometry,
          subQuestionAnswers,
        },
      ]);
      setSelectionType(null);
    }
    handleMapDraw();

    // Cleanup function - prevent any state changes if the component was unmounted
    return () => {
      setDrawingCancelled(true);
    };
  }, [selectionType]);

  /**
   * When starting to draw for a different question,¨
   * reset selection type to null
   */
  useEffect(() => {
    if (!isMapReady || question.id == null) {
      return;
    }
    if (drawingQuestionId !== question.id) {
      setSelectionType(null);
      stopDrawing(question.id);
    }
  }, [drawingQuestionId]);

  /**
   * When map becomes inactive, clear selected selection type
   */
  useEffect(() => {
    if (!isMapActive) {
      setSelectionType(null);
    }
  }, [isMapActive]);

  async function getSubQuestionAnswers() {
    // Don't open the dialog at all if there are no subquestions
    if (!question.subQuestions?.length) {
      return [];
    }
    return await new Promise<MapQuestionAnswer['subQuestionAnswers']>(
      (resolve) => {
        setSubQuestionDialogOpen(true);
        setHandleSubQuestionDialogClose(
          () => (answers: SurveyMapSubQuestionAnswer[]) => {
            resolve(answers);
            setSubQuestionDialogOpen(false);
          }
        );
      }
    );
  }

  function getToggleButton(selectionType: MapQuestionSelectionType) {
    return (
      <ToggleButton
        value={selectionType}
        aria-label={selectionType}
        disabled={!isMapReady}
      >
        <Badge
          badgeContent={
            value?.filter((answer) => answer.selectionType === selectionType)
              .length
          }
          color="secondary"
        >
          {selectionType === 'point' && <PointIcon width="2rem" />}
          {selectionType === 'line' && <LineIcon width="2rem" />}
          {selectionType === 'area' && <AreaIcon width="2rem" />}
        </Badge>
        <Typography style={{ marginLeft: '1rem' }}>
          {tr.MapQuestion.selectionTypes[selectionType]}
        </Typography>
      </ToggleButton>
    );
  }

  return (
    <>
      <ToggleButtonGroup
        value={selectionType}
        exclusive
        onChange={(_, newValue) => {
          setSelectionType(newValue);
        }}
        aria-label="map-selection-type"
      >
        {question.selectionTypes.includes('point') && getToggleButton('point')}
        {question.selectionTypes.includes('line') && getToggleButton('line')}
        {question.selectionTypes.includes('area') && getToggleButton('area')}
      </ToggleButtonGroup>
      {selectionType !== null && (
        <FormHelperText>
          {tr.MapQuestion.selectionHelperText[selectionType]}
        </FormHelperText>
      )}
      {value?.length > 0 && (
        <div>
          <Button
            style={{ marginTop: '2rem' }}
            variant="outlined"
            color="primary"
            onClick={() => {
              onChange([]);
            }}
          >
            {tr.MapQuestion.clearAnswers}
          </Button>
        </div>
      )}
      <MapSubQuestionDialog
        open={subQuestionDialogOpen}
        subQuestions={question.subQuestions}
        onSubmit={(answers) => {
          handleSubQuestionDialogClose(answers);
        }}
        onCancel={() => {
          handleSubQuestionDialogClose(null);
        }}
      />
    </>
  );
}
