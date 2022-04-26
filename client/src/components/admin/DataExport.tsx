import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from '@material-ui/core';
import { useToasts } from '@src/stores/ToastContext';
import { useTranslations } from '@src/stores/TranslationContext';
import { request } from '@src/utils/request';
import React, { useState } from 'react';

interface Props {
  surveyId: number;
}

export default function DataExport({ surveyId }: Props) {
  const [displayDialog, setDisplayDialog] = useState(false);
  const [selectedFileFormats, setSelectedFileFormats] = useState({
    csv: true,
    geopackage: false,
  });
  const { tr } = useTranslations();
  const { showToast } = useToasts();

  async function exportCSV() {
    try {
      const res = (await request(`/api/answers/${surveyId}/file-export/csv`, {
        method: 'POST',
      })) as string;

      const link = document.createElement('a');
      link.href = `data:text/csv;charset=utf-8,${encodeURI(res)}`;
      link.target = '_blank';
      link.download = 'data.csv';
      link.click();
    } catch (err) {
      showToast({
        severity: 'error',
        message: err.message,
      });
    }
  }

  async function exportGeoPackage() {
    try {
      const res = await fetch(
        `/api/answers/${surveyId}/file-export/geopackage`,
        {
          method: 'POST',
        }
      );

      if (!res.ok) {
        let error: string | object = await res.text();
        error = JSON.parse(error as string);
        throw {
          ...(typeof error === 'object'
            ? error
            : {
                text: error,
              }),
          status: res.status,
        };
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const blobLink = document.createElement('a');
      blobLink.href = blobUrl;
      blobLink.download = 'geopackage.gpkg';
      blobLink.click();
    } catch (err) {
      showToast({
        severity: 'error',
        message: err.message,
      });
    }
  }

  return (
    <>
      <Button
        style={{ marginLeft: 'auto' }}
        variant="contained"
        onClick={() => setDisplayDialog((prev) => !prev)}
      >
        {tr.DataExport.exportAnswers}
      </Button>
      <Dialog open={displayDialog} onClose={() => setDisplayDialog(false)}>
        <DialogTitle> {tr.DataExport.surveyAnswerExport} </DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography> {tr.DataExport.chooseFileFormat} </Typography>
          <FormControlLabel
            label="CSV"
            control={
              <Checkbox
                checked={selectedFileFormats.csv}
                onChange={(event) =>
                  setSelectedFileFormats({
                    ...selectedFileFormats,
                    csv: event.target.checked,
                  })
                }
              />
            }
          />
          <FormControlLabel
            label="Geopackage"
            control={
              <Checkbox
                checked={selectedFileFormats.geopackage}
                onChange={(event) =>
                  setSelectedFileFormats({
                    ...selectedFileFormats,
                    geopackage: event.target.checked,
                  })
                }
              />
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisplayDialog(false)}>
            {tr.commands.cancel}
          </Button>
          <Button
            onClick={() => {
              setDisplayDialog(false);
              selectedFileFormats.csv && exportCSV();
              selectedFileFormats.geopackage && exportGeoPackage();
            }}
          >
            {' '}
            {tr.DataExport.download}{' '}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}