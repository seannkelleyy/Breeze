package jobs

import (
	"context"
	"testing"

	"github.com/riverqueue/river"
	"github.com/stretchr/testify/assert"
)

type testJob struct{ Msg string }

func (testJob) Kind() string { return "test" }

type testWorker struct{}

func (w *testWorker) Work(ctx context.Context, job *river.Job[testJob]) error {
	return nil
}

func TestTestWorker_ImplementsWork(t *testing.T) {
	w := &testWorker{}
	job := &river.Job[testJob]{Args: testJob{Msg: "hi"}}
	err := w.Work(context.Background(), job)
	assert.NoError(t, err)
}
