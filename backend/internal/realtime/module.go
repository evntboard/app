package realtime

import (
	"fmt"
)

func (c *Client) GetChannelForModule(moduleSession string) string {
	return fmt.Sprintf("module.%s", moduleSession)
}
